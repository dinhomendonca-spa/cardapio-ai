"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  supabase,
} from "@/lib/supabase";

type Pagamento = {
  id: string;
  valor: number;
  vencimento: string | null;
  link: string | null;
  pixCopiaCola: string;
  pixImagem: string;
  pixExpiraEm: string | null;
};

type RespostaCobranca = {
  reutilizada: boolean;
  pagamento: Pagamento;
  erro?: string;
};

type RespostaStatus = {
  status: string;
  ativo: boolean;
  lojaId: number | null;
  fimPeriodo: string | null;
  proximaCobranca: string | null;
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

  const partes =
    valor.split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(new Date(valor));
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

export default function AssinarPage() {
  const router = useRouter();

  const {
    user,
    carregandoAuth,
    sair,
  } = useAuth();

  const iniciou =
    useRef(false);

  const [
    pagamento,
    setPagamento,
  ] = useState<Pagamento | null>(
    null
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    verificando,
    setVerificando,
  ] = useState(false);

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

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
              cache: "no-store",
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

        if (resultado.ativo) {
          router.replace("/admin");
          return true;
        }

        return false;
      } catch (error) {
        if (mostrarCarregamento) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível verificar o pagamento."
          );
        }

        return false;
      } finally {
        if (mostrarCarregamento) {
          setVerificando(false);
        }
      }
    };

  useEffect(() => {
    if (carregandoAuth) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (iniciou.current) {
      return;
    }

    iniciou.current = true;

    const carregar =
      async () => {
        setCarregando(true);
        setErro("");

        try {
          const jaEstaAtiva =
            await verificarStatus();

          if (jaEstaAtiva) {
            return;
          }

          const token =
            await obterToken();

          const resposta =
            await fetch(
              "/api/asaas/cobranca",
              {
                method: "POST",
                headers: {
                  authorization:
                    `Bearer ${token}`,
                  "content-type":
                    "application/json",
                },
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
                "Não foi possível gerar o Pix."
            );
          }

          setPagamento(
            resultado.pagamento
          );
        } catch (error) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o Pix."
          );
        } finally {
          setCarregando(false);
        }
      };

    carregar();
  }, [
    carregandoAuth,
    user,
    router,
  ]);

  useEffect(() => {
    if (!user || !pagamento) {
      return;
    }

    const intervalo =
      window.setInterval(() => {
        verificarStatus();
      }, 5000);

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    user,
    pagamento,
  ]);

  const copiarPix = async () => {
    if (
      !pagamento?.pixCopiaCola
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        pagamento.pixCopiaCola
      );

      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 2500);
    } catch {
      setErro(
        "Não foi possível copiar. Selecione o código manualmente."
      );
    }
  };

  const fazerLogout = async () => {
    try {
      await sair();
      router.replace("/login");
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
            Preparando seu pagamento...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
              Visite Minha Loja
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Ative sua assinatura
            </h1>
          </div>

          <button
            type="button"
            onClick={fazerLogout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10"
            aria-label="Sair"
          >
            <LogOut size={19} />
          </button>
        </header>

        <div className="mt-6 overflow-hidden rounded-[32px] bg-white text-slate-950 shadow-2xl">
          <div className="bg-gradient-to-br from-sky-500 to-blue-700 p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
                  Plano Mensal
                </p>

                <p className="mt-2 text-4xl font-black">
                  R$ 59,90
                </p>

                <p className="mt-1 text-sm text-sky-100">
                  por mês
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles size={27} />
              </div>
            </div>
          </div>

          {erro ? (
            <div className="p-6">
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
              >
                {erro}
              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white"
              >
                <RefreshCw size={18} />
                Tentar novamente
              </button>
            </div>
          ) : (
            pagamento && (
              <div className="p-5 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-fit items-center gap-2 rounded-full bg-amber-100 px-4 text-xs font-bold text-amber-700">
                    <Clock3 size={16} />
                    Aguardando pagamento
                  </div>

                  <h2 className="mt-4 text-xl font-black">
                    Pague usando o Pix
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Abra o aplicativo do seu
                    banco e escaneie o QR Code.
                  </p>
                </div>

                {pagamento.pixImagem && (
                  <div className="mx-auto mt-5 w-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Image
                      src={
                        pagamento.pixImagem.startsWith(
                          "data:"
                        )
                          ? pagamento.pixImagem
                          : `data:image/png;base64,${pagamento.pixImagem}`
                      }
                      alt="QR Code Pix da mensalidade"
                      width={240}
                      height={240}
                      unoptimized
                      priority
                    />
                  </div>
                )}

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
                      pagamento.pixCopiaCola
                    }
                    rows={3}
                    className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 outline-none"
                    aria-label="Código Pix copia e cola"
                  />

                  <button
                    type="button"
                    onClick={copiarPix}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-sky-600"
                  >
                    {copiado ? (
                      <>
                        <Check size={18} />
                        Código copiado
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar código Pix
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Valor
                    </p>

                    <p className="mt-1 text-sm font-black">
                      {formatarDinheiro(
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
                        pagamento.vencimento
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    verificarStatus(true)
                  }
                  disabled={verificando}
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
                      <CheckCircle2 size={18} />
                      Já paguei, verificar agora
                    </>
                  )}
                </button>

                {pagamento.link && (
                  <Link
                    href={pagamento.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ExternalLink size={17} />
                    Abrir cobrança no Asaas
                  </Link>
                )}
              </div>
            )
          )}
        </div>

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
                pagamento, seu acesso será
                liberado automaticamente
                pelo período mensal.
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
            Nas contratações online, o
            cancelamento pode ser
            solicitado em até 7 dias,
            conforme a legislação
            aplicável.
          </p>
        </div>
      </div>
    </main>
  );
}