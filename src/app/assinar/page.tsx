"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  supabase,
} from "@/lib/supabase";

type PlanoId =
  | "mensal"
  | "anual";

type FormaPagamento =
  | "pix"
  | "cartao"
  | "indefinido";

type PlanoResposta = {
  id: PlanoId;
  nome: string;
  valor: number;
  valorMensal: number;
  meses: number;
};

type Pagamento = {
  id: string;
  valor: number;
  vencimento: string | null;
  link: string | null;
  pixCopiaCola: string | null;
  pixImagem: string | null;
  pixExpiraEm: string | null;
};

type RespostaCobranca = {
  reutilizada: boolean;

  formaPagamento?:
    | FormaPagamento
    | string;

  asaasParcelamentoId?:
    | string
    | null;

  plano?: PlanoResposta;

  pagamento?: Pagamento;

  erro?: string;
};

type RespostaStatus = {
  status: string;
  ativo: boolean;
  lojaId: number | null;
  fimPeriodo: string | null;
  proximaCobranca: string | null;
  tipoAcesso?: string;
  testeGratis?: boolean;
  testeDisponivel?: boolean;
  testeInicio?: string | null;
  testeFim?: string | null;
  diasRestantesTeste?: number;
  erro?: string;
};

type RespostaTeste = {
  mensagem?: string;
  codigo?: string;
  ativo?: boolean;
  testeGratis?: boolean;
  testeInicio?: string | null;
  testeFim?: string | null;
  duracaoDias?: number;
  erro?: string;
};

function formatarDinheiro(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

function formatarData(
  valor: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const dataSimples =
    /^\d{4}-\d{2}-\d{2}$/.test(
      valor
    );

  if (dataSimples) {
    const [
      ano,
      mes,
      dia,
    ] = valor.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(data);
}

async function obterToken() {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (
    error ||
    !data.session?.access_token
  ) {
    throw new Error(
      "Sua sessão expirou. Entre novamente."
    );
  }

  return data.session.access_token;
}

function AssinarConteudo() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    user,
    carregandoAuth,
    sair,
  } = useAuth();

  const planoDaUrl: PlanoId =
    searchParams.get("plano") ===
    "anual"
      ? "anual"
      : "mensal";

  const desejaContratar =
    searchParams.get("contratar") ===
    "1";

  const iniciou =
    useRef(false);

  const [
    pagamento,
    setPagamento,
  ] =
    useState<Pagamento | null>(
      null
    );

  const [
    planoSelecionado,
    setPlanoSelecionado,
  ] =
    useState<PlanoId | null>(
      null
    );

  const [
    formaSelecionada,
    setFormaSelecionada,
  ] =
    useState<FormaPagamento | null>(
      null
    );

  const [
    planoConfirmado,
    setPlanoConfirmado,
  ] =
    useState<PlanoResposta | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    gerandoPagamento,
    setGerandoPagamento,
  ] =
    useState<string | null>(
      null
    );

  const [
    verificando,
    setVerificando,
  ] =
    useState(false);

  const [
    copiado,
    setCopiado,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    testeDisponivel,
    setTesteDisponivel,
  ] = useState(false);

  const [
    testeJaUtilizado,
    setTesteJaUtilizado,
  ] = useState(false);

  const [
    testeAtivo,
    setTesteAtivo,
  ] = useState(false);

  const [
    diasRestantesTeste,
    setDiasRestantesTeste,
  ] = useState<number | null>(null);

  const [
    ativandoTeste,
    setAtivandoTeste,
  ] = useState(false);

  const verificarStatus =
    async (
      mostrarCarregamento = false
    ) => {
      if (!user) {
        return false;
      }

      if (mostrarCarregamento) {
        setVerificando(true);
      }

      try {
        const token =
          await obterToken();

        const resposta =
          await fetch(
            "/api/assinatura/status",
            {
              method: "GET",

              headers: {
                authorization:
                  `Bearer ${token}`,
              },

              cache:
                "no-store",
            }
          );

        const resultado =
          (await resposta.json()) as
            RespostaStatus;

        if (!resposta.ok) {
          throw new Error(
            resultado.erro ||
              "Não foi possível verificar o pagamento."
          );
        }

        const acessoDeTesteAtivo =
          resultado.ativo &&
          resultado.tipoAcesso ===
            "TESTE_GRATIS";

        if (
          acessoDeTesteAtivo &&
          desejaContratar
        ) {
          setTesteAtivo(true);
          setDiasRestantesTeste(
            typeof resultado.diasRestantesTeste ===
              "number"
              ? resultado.diasRestantesTeste
              : null
          );
          setTesteDisponivel(false);
          setTesteJaUtilizado(false);

          return false;
        }

        if (resultado.ativo) {
          router.replace(
            "/admin"
          );

          return true;
        }

        setTesteDisponivel(
          Boolean(
            resultado.testeDisponivel
          )
        );

        setTesteAtivo(false);
        setDiasRestantesTeste(null);

        setTesteJaUtilizado(
          Boolean(
            !resultado.testeDisponivel &&
              resultado.testeInicio
          )
        );

        return false;
      } catch (error) {
        if (
          mostrarCarregamento
        ) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível verificar o pagamento."
          );
        }

        return false;
      } finally {
        if (
          mostrarCarregamento
        ) {
          setVerificando(
            false
          );
        }
      }
    };

  useEffect(() => {
    if (carregandoAuth) {
      return;
    }

    if (!user) {
      router.replace(
        `/login?plano=${planoDaUrl}`
      );

      return;
    }

    if (iniciou.current) {
      return;
    }

    iniciou.current =
      true;

    const carregar =
      async () => {
        setCarregando(true);
        setErro("");

        try {
          await verificarStatus();
        } catch {
          setErro(
            "Não foi possível verificar sua assinatura."
          );
        } finally {
          setCarregando(
            false
          );
        }
      };

    carregar();
  }, [
    carregandoAuth,
    user,
    router,
    planoDaUrl,
    desejaContratar,
  ]);

  useEffect(() => {
    if (
      !user ||
      !pagamento
    ) {
      return;
    }

    const intervalo =
      window.setInterval(
        () => {
          verificarStatus();
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    user,
    pagamento,
  ]);

  const contratarPlano =
    async (
      plano: PlanoId,
      formaPagamento:
        FormaPagamento
    ) => {
      if (
        gerandoPagamento
      ) {
        return;
      }

      const chave =
        `${plano}:${formaPagamento}`;

      setPlanoSelecionado(
        plano
      );

      setFormaSelecionada(
        formaPagamento
      );

      setGerandoPagamento(
        chave
      );

      setErro("");
      setPagamento(null);
      setPlanoConfirmado(
        null
      );

      try {
        const token =
          await obterToken();

        const resposta =
          await fetch(
            "/api/asaas/cobranca",
            {
              method:
                "POST",

              headers: {
                authorization:
                  `Bearer ${token}`,

                "content-type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  plano,

                  formaPagamento:
                    formaPagamento ===
                    "indefinido"
                      ? undefined
                      : formaPagamento,
                }),
            }
          );

        const resultado =
          (await resposta.json()) as
            RespostaCobranca;

        if (
          !resposta.ok ||
          !resultado.pagamento
        ) {
          throw new Error(
            resultado.erro ||
              "Não foi possível gerar a cobrança."
          );
        }

        setPagamento(
          resultado.pagamento
        );

        if (
          resultado.formaPagamento
        ) {
          const forma =
            resultado.formaPagamento;

          if (
            forma === "pix" ||
            forma === "cartao" ||
            forma === "indefinido"
          ) {
            setFormaSelecionada(
              forma
            );
          }
        }

        if (
          resultado.plano
        ) {
          setPlanoConfirmado(
            resultado.plano
          );
        } else {
          setPlanoConfirmado(
            plano === "anual"
              ? {
                  id:
                    "anual",

                  nome:
                    "Anual Promocional",

                  valor:
                    597,

                  valorMensal:
                    49.75,

                  meses:
                    12,
                }
              : {
                  id:
                    "mensal",

                  nome:
                    "Mensal",

                  valor:
                    59.9,

                  valorMensal:
                    59.9,

                  meses:
                    1,
                }
          );
        }
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível gerar a cobrança."
        );

        setPlanoSelecionado(
          null
        );

        setFormaSelecionada(
          null
        );
      } finally {
        setGerandoPagamento(
          null
        );
      }
    };

  const iniciarTesteGratis =
    async () => {
      if (ativandoTeste) {
        return;
      }

      setAtivandoTeste(true);
      setErro("");

      try {
        const token =
          await obterToken();

        const resposta =
          await fetch(
            "/api/assinatura/teste",
            {
              method: "POST",
              headers: {
                authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const resultado =
          (await resposta.json()) as
            RespostaTeste;

        if (!resposta.ok) {
          if (
            resultado.codigo ===
              "TESTE_ATIVO" ||
            resultado.codigo ===
              "ASSINATURA_ATIVA" ||
            resultado.codigo ===
              "ACESSO_VITALICIO"
          ) {
            router.replace("/admin");
            router.refresh();
            return;
          }

          if (
            resultado.codigo ===
            "TESTE_UTILIZADO"
          ) {
            setTesteDisponivel(false);
            setTesteJaUtilizado(true);
          }

          throw new Error(
            resultado.erro ||
              "Não foi possível ativar o teste grátis."
          );
        }

        router.replace("/admin");
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível ativar o teste grátis."
        );
        setAtivandoTeste(false);
      }
    };

  const copiarPix =
    async () => {
      if (
        !pagamento
          ?.pixCopiaCola
      ) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            pagamento
              .pixCopiaCola
          );

        setCopiado(true);

        window.setTimeout(
          () => {
            setCopiado(
              false
            );
          },
          2500
        );
      } catch {
        setErro(
          "Não foi possível copiar. Selecione o código manualmente."
        );
      }
    };

  const fazerLogout =
    async () => {
      try {
        await sair();

        router.replace(
          `/login?plano=${planoDaUrl}`
        );
      } catch {
        setErro(
          "Não foi possível sair agora."
        );
      }
    };

  if (
    carregandoAuth ||
    carregando
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 text-white">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-4 text-sm text-slate-400">
            Preparando sua
            assinatura...
          </p>
        </div>
      </main>
    );
  }

  const ehAnual =
    planoSelecionado ===
    "anual";

  const ehCartaoAnual =
    ehAnual &&
    formaSelecionada ===
      "cartao";

  const ehPixAnual =
    ehAnual &&
    formaSelecionada ===
      "pix";

  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-2xl">

        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
              Visite Minha Loja
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Ative sua assinatura
            </h1>
          </div>

          <button
            type="button"
            onClick={
              fazerLogout
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10"
            aria-label="Sair"
          >
            <LogOut
              size={19}
            />
          </button>
        </header>

        {!pagamento && (
          <>
            <section className="mt-6 overflow-hidden rounded-[30px] border border-sky-300/25 bg-gradient-to-br from-sky-500/20 to-blue-600/10 shadow-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
                  <Gift size={27} />
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                  Experimente antes de pagar
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Teste grátis por 30 dias
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
                  Use a loja completa, cadastre seus produtos e receba pedidos pelo WhatsApp. Não precisa informar cartão.
                </p>

                {testeAtivo ? (
                  <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-semibold leading-6 text-emerald-200">
                    Seu teste grátis está ativo
                    {diasRestantesTeste !== null
                      ? ` e ainda possui ${diasRestantesTeste} ${
                          diasRestantesTeste === 1
                            ? "dia"
                            : "dias"
                        }.`
                      : "."}
                    {" "}Você pode contratar um dos planos abaixo sem perder o acesso atual.
                  </div>
                ) : testeDisponivel ? (
                  <button
                    type="button"
                    onClick={iniciarTesteGratis}
                    disabled={
                      ativandoTeste ||
                      gerandoPagamento !== null
                    }
                    className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-4 text-sm font-black text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {ativandoTeste ? (
                      <>
                        <LoaderCircle size={19} className="animate-spin" />
                        Ativando teste...
                      </>
                    ) : (
                      <>
                        <Zap size={19} />
                        Começar teste grátis
                      </>
                    )}
                  </button>
                ) : testeJaUtilizado ? (
                  <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-semibold text-amber-200">
                    O teste grátis desta loja já foi utilizado. Escolha um dos planos abaixo para continuar.
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-slate-400">
                    Verificando disponibilidade do teste...
                  </div>
                )}
              </div>
            </section>

            {planoDaUrl ===
              "anual" && (
              <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] p-5 text-center">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                  0 Sua oferta foi preservada
                </p>

                <div className="mt-2 flex items-end justify-center gap-2">
                  <span className="mb-1 text-sm font-bold text-emerald-200">
                    12x de
                  </span>

                  <span className="text-4xl font-black text-white">
                    R$ 49,75
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-300">
                  No cartão de crédito.
                  Você também pode pagar
                  R$ 597 à vista no Pix.
                </p>
              </div>
            )}

            <div className="mt-7 text-center">
              <p className="text-sm leading-6 text-slate-400">
                Escolha o plano e a
                forma de pagamento que
                preferir.
              </p>
            </div>

            {erro && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-semibold leading-6 text-red-200"
              >
                {erro}
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <section
                className={`overflow-hidden rounded-[30px] bg-white text-slate-950 shadow-2xl ${
                  planoDaUrl ===
                  "mensal"
                    ? "border-2 border-sky-400"
                    : "border border-white/10"
                }`}
              >
                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
                        Plano Mensal
                      </p>

                      <p className="mt-4 text-4xl font-black">
                        R$ 59,90
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        por mês
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                      <Sparkles
                        size={23}
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-sm font-semibold text-slate-600">

                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-500"
                      />

                      1 mês de acesso
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard
                        size={18}
                        className="shrink-0 text-sky-600"
                      />

                      Pix ou cartão
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={18}
                        className="shrink-0 text-sky-600"
                      />

                      Liberação automática
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      contratarPlano(
                        "mensal",
                        "indefinido"
                      )
                    }
                    disabled={
                      gerandoPagamento !==
                      null
                    }
                    className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {gerandoPagamento ===
                    "mensal:indefinido" ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />

                        Gerando cobrança...
                      </>
                    ) : (
                      <>
                        Escolher mensal

                        <ArrowRight
                          size={17}
                        />
                      </>
                    )}
                  </button>
                </div>
              </section>

              <section
                className={`relative overflow-hidden rounded-[30px] bg-white text-slate-950 shadow-2xl shadow-emerald-950/20 ${
                  planoDaUrl ===
                  "anual"
                    ? "border-4 border-emerald-400"
                    : "border-2 border-emerald-400"
                }`}
              >
                <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow">
                  Melhor oferta
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white">

                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-50">
                     Oferta de lançamento
                  </p>

                  <div className="mt-4">
                    <span className="text-sm font-bold text-emerald-50">
                      12x de
                    </span>

                    <p className="text-4xl font-black">
                      R$ 49,75
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-emerald-50">
                    no cartão de crédito
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-2 text-xs font-black">
                    12 meses de acesso
                  </div>
                </div>

                <div className="p-6">

                  <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Você economiza
                    </p>

                    <p className="mt-1 text-2xl font-black text-emerald-700">
                      R$ 121,80
                    </p>

                    <p className="mt-1 text-xs font-semibold text-emerald-700/70">
                      comparado a 12
                      mensalidades
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">

                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-500"
                      />

                      12 meses de acesso
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard
                        size={18}
                        className="shrink-0 text-emerald-600"
                      />

                      Cartão em 12 parcelas
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap
                        size={18}
                        className="shrink-0 text-emerald-600"
                      />

                      Pix de R$ 597 à vista
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={18}
                        className="shrink-0 text-emerald-600"
                      />

                      Liberação automática
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        contratarPlano(
                          "anual",
                          "cartao"
                        )
                      }
                      disabled={
                        gerandoPagamento !==
                        null
                      }
                      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {gerandoPagamento ===
                      "anual:cartao" ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />

                          Preparando cartão...
                        </>
                      ) : (
                        <>
                          <CreditCard
                            size={19}
                          />

                          Pagar 12x de R$ 49,75
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        contratarPlano(
                          "anual",
                          "pix"
                        )
                      }
                      disabled={
                        gerandoPagamento !==
                        null
                      }
                      className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {gerandoPagamento ===
                      "anual:pix" ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />

                          Gerando Pix...
                        </>
                      ) : (
                        <>
                          <QrCode
                            size={18}
                          />

                          Pix — R$ 597 à vista
                        </>
                      )}
                    </button>

                  </div>

                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                    Total do plano anual:
                    R$ 597.
                  </p>
                </div>
              </section>
            </div>
          </>
        )}

        {pagamento && (
          <div className="mt-7 overflow-hidden rounded-[32px] bg-white text-slate-950 shadow-2xl">

            <div
              className={
                ehAnual
                  ? "bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white"
                  : "bg-gradient-to-br from-sky-500 to-blue-700 p-6 text-white"
              }
            >
              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                    {planoConfirmado
                      ?.nome ??
                      (ehAnual
                        ? "Anual Promocional"
                        : "Mensal")}
                  </p>

                  {ehCartaoAnual ? (
                    <>
                      <p className="mt-2 text-sm font-bold text-white/80">
                        12x de
                      </p>

                      <p className="text-4xl font-black">
                        R$ 49,75
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white/80">
                        Total R$ 597 ·
                        12 meses de acesso
                      </p>
                    </>
                  ) : ehPixAnual ? (
                    <>
                      <p className="mt-2 text-4xl font-black">
                        R$ 597,00
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white/80">
                        Pix à vista ·
                        12 meses de acesso
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-4xl font-black">
                        {formatarDinheiro(
                          pagamento.valor
                        )}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white/80">
                        1 mês de acesso
                      </p>
                    </>
                  )}
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  {ehPixAnual ? (
                    <QrCode
                      size={27}
                    />
                  ) : (
                    <CreditCard
                      size={27}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">

              {erro && (
                <div
                  role="alert"
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
                >
                  {erro}
                </div>
              )}

              <div className="text-center">

                <div className="mx-auto flex h-11 w-fit items-center gap-2 rounded-full bg-amber-100 px-4 text-xs font-bold text-amber-700">
                  <Clock3
                    size={16}
                  />

                  Aguardando pagamento
                </div>

                <h2 className="mt-4 text-xl font-black">
                  {ehCartaoAnual
                    ? "Finalize no cartão"
                    : ehPixAnual
                      ? "Finalize seu Pix"
                      : "Escolha como pagar"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {ehCartaoAnual
                    ? "Clique no botão abaixo para abrir a página segura do Asaas e concluir o pagamento em 12 parcelas."
                    : ehPixAnual
                      ? "Escaneie o QR Code ou copie o código Pix abaixo."
                      : "Você pode pagar com Pix ou cartão de crédito."}
                </p>
              </div>

              {pagamento.link && (
                <Link
                  href={
                    pagamento.link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-black text-white transition ${
                    ehCartaoAnual
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-slate-950 hover:bg-sky-600"
                  }`}
                >
                  {ehCartaoAnual ? (
                    <>
                      <CreditCard
                        size={20}
                      />

                      Pagar 12x de R$ 49,75
                    </>
                  ) : ehPixAnual ? (
                    <>
                      <ExternalLink
                        size={19}
                      />

                      Abrir pagamento no Asaas
                    </>
                  ) : (
                    <>
                      <WalletCards
                        size={20}
                      />

                      Pagar com Pix ou cartão
                    </>
                  )}

                  <ExternalLink
                    size={17}
                  />
                </Link>
              )}

              {!ehCartaoAnual && (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Pix
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {pagamento.pixImagem ? (
                    <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                      <Image
                        src={
                          pagamento
                            .pixImagem
                            .startsWith(
                              "data:"
                            )
                            ? pagamento
                                .pixImagem
                            : `data:image/png;base64,${pagamento.pixImagem}`
                        }
                        alt="QR Code Pix da assinatura"
                        width={240}
                        height={240}
                        unoptimized
                        priority
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-semibold text-slate-500">
                      O QR Code Pix não
                      está disponível
                      neste momento.

                      {pagamento.link &&
                        " Você ainda pode abrir a cobrança pelo botão acima."}
                    </div>
                  )}

                  {pagamento.pixCopiaCola && (
                    <div className="mt-5 rounded-2xl bg-slate-100 p-4">

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-slate-600">
                          Pix copia e cola
                        </p>

                        <QrCode
                          size={17}
                          className="text-sky-600"
                        />
                      </div>

                      <textarea
                        readOnly
                        value={
                          pagamento
                            .pixCopiaCola
                        }
                        rows={3}
                        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 outline-none"
                        aria-label="Código Pix copia e cola"
                      />

                      <button
                        type="button"
                        onClick={
                          copiarPix
                        }
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-sky-600"
                      >
                        {copiado ? (
                          <>
                            <Check
                              size={18}
                            />

                            Código copiado
                          </>
                        ) : (
                          <>
                            <Copy
                              size={18}
                            />

                            Copiar código Pix
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {ehCartaoAnual
                      ? "Parcela"
                      : "Valor"}
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {ehCartaoAnual
                      ? "R$ 49,75"
                      : formatarDinheiro(
                          pagamento.valor
                        )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Vencimento
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {formatarData(
                      pagamento
                        .vencimento
                    )}
                  </p>
                </div>
              </div>

              {ehCartaoAnual && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard
                      size={19}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-sm font-black text-emerald-800">
                        12 parcelas de R$ 49,75
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        Valor total contratado:
                        R$ 597,00. Após a
                        confirmação do pagamento,
                        sua loja recebe 12 meses
                        de acesso.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  verificarStatus(
                    true
                  )
                }
                disabled={
                  verificando
                }
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 text-sm font-black text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
              >
                {verificando ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />

                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={18}
                    />

                    Já paguei, verificar agora
                  </>
                )}
              </button>

              {pagamento.link && (
                <Link
                  href={
                    pagamento.link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <ExternalLink
                    size={17}
                  />

                  Abrir cobrança no Asaas
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-5">
          <div className="flex items-start gap-3">

            <LockKeyhole
              size={20}
              className="mt-0.5 shrink-0 text-sky-300"
            />

            <div>
              <p className="text-sm font-bold">
                Liberação automática
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Após a confirmação do
                pagamento, seu acesso
                será liberado
                automaticamente pelo
                período do plano
                contratado.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">

          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-emerald-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            Nas contratações online,
            o cancelamento pode ser
            solicitado em até 7 dias,
            conforme a legislação
            aplicável.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AssinarPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 text-white">
          <div className="text-center">
            <LoaderCircle
              size={38}
              className="mx-auto animate-spin text-sky-400"
            />

            <p className="mt-4 text-sm text-slate-400">
              Preparando sua
              assinatura...
            </p>
          </div>
        </main>
      }
    >
      <AssinarConteudo />
    </Suspense>
  );
}

