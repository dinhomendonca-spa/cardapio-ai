"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Loader2,
  LogOut,
  RefreshCw,
  Store,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

type RespostaStatus = {
  status: string;
  ativo: boolean;
  tipoAcesso?:
    | "VITALICIO"
    | "TESTE_GRATIS"
    | "ASSINATURA"
    | "SEM_ACESSO";
  testeGratis?: boolean;
  testeDisponivel?: boolean;
  testeInicio?: string | null;
  testeFim?: string | null;
  diasRestantesTeste?: number;
  erro?: string;
};

const ROTAS_TUTORIAL =
  new Set([
    "/admin/loja",
    "/admin/entrega",
    "/admin/produtos",
    "/admin/produtos/novo",
    "/admin/publicar",
  ]);

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    session,
    carregandoAuth,
    sair,
  } = useAuth();

  const {
    loja,
    carregando,
    erroLoja,
  } = useStore();

  const verificacaoIniciada =
    useRef(false);

  const [
    verificandoAssinatura,
    setVerificandoAssinatura,
  ] = useState(true);

  const [
    acessoAtivo,
    setAcessoAtivo,
  ] = useState(false);

  const [
    erroAssinatura,
    setErroAssinatura,
  ] = useState("");

  const [
    tipoAcesso,
    setTipoAcesso,
  ] =
    useState<
      RespostaStatus["tipoAcesso"]
    >("SEM_ACESSO");

  const [
    diasRestantesTeste,
    setDiasRestantesTeste,
  ] = useState(0);

  const [
    testeFim,
    setTesteFim,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (carregandoAuth) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (
      !session?.access_token ||
      verificacaoIniciada.current
    ) {
      return;
    }

    verificacaoIniciada.current =
      true;

    let cancelado = false;

    const verificarAssinatura =
      async () => {
        setVerificandoAssinatura(
          true
        );

        setErroAssinatura("");

        try {
          const resposta =
            await fetch(
              "/api/assinatura/status",
              {
                method: "GET",

                headers: {
                  authorization:
                    `Bearer ${session.access_token}`,
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
                "Não foi possível verificar sua assinatura."
            );
          }

          if (cancelado) {
            return;
          }

          if (!resultado.ativo) {
            router.replace(
              "/assinar"
            );

            return;
          }

          setTipoAcesso(
            resultado.tipoAcesso ??
              (
                resultado.testeGratis
                  ? "TESTE_GRATIS"
                  : "ASSINATURA"
              )
          );

          setDiasRestantesTeste(
            resultado
              .diasRestantesTeste ??
              0
          );

          setTesteFim(
            resultado.testeFim ??
              null
          );

          setAcessoAtivo(true);

          setVerificandoAssinatura(
            false
          );
        } catch (error) {
          if (cancelado) {
            return;
          }

          setErroAssinatura(
            error instanceof Error
              ? error.message
              : "Não foi possível verificar sua assinatura."
          );

          setVerificandoAssinatura(
            false
          );

          verificacaoIniciada.current =
            false;
        }
      };

    verificarAssinatura();

    return () => {
      cancelado = true;
    };
  }, [
    user,
    session?.access_token,
    carregandoAuth,
    router,
  ]);

  const rotaTutorialPermitida =
    ROTAS_TUTORIAL.has(
      pathname
    );

  const precisaIniciarTutorial =
    Boolean(
      acessoAtivo &&
        loja &&
        !loja.configuracao_concluida &&
        !rotaTutorialPermitida
    );

  useEffect(() => {
    if (
      precisaIniciarTutorial
    ) {
      router.replace(
        "/admin/loja"
      );
    }
  }, [
    precisaIniciarTutorial,
    router,
  ]);

  const fazerLogout =
    async () => {
      try {
        await sair();

        router.replace(
          "/login"
        );
      } catch (error) {
        console.error(
          "Erro ao sair:",
          error
        );

        alert(
          "Não foi possível sair."
        );
      }
    };

  const abrirPlanos = () => {
    router.push(
      "/assinar?plano=mensal&contratar=1"
    );
  };

  const carregamentoInicialDaLoja =
    Boolean(
      user &&
        acessoAtivo &&
        carregando &&
        !loja
    );

  const mostrarAvisoTeste =
    tipoAcesso ===
      "TESTE_GRATIS" &&
    diasRestantesTeste > 0 &&
    diasRestantesTeste <= 7;

  const avisoUrgente =
    diasRestantesTeste <= 1;

  const avisoAtencao =
    diasRestantesTeste > 1 &&
    diasRestantesTeste <= 3;

  const formatarDataTeste = (
    valor: string | null
  ) => {
    if (!valor) {
      return "";
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "pt-BR"
    ).format(data);
  };

  if (
    carregandoAuth ||
    verificandoAssinatura ||
    carregamentoInicialDaLoja ||
    precisaIniciarTutorial
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] text-white">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-3 text-sm font-medium text-slate-400">
            {precisaIniciarTutorial
              ? "Preparando a configuração da loja..."
              : "Verificando seu acesso..."}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#020b18]" />
    );
  }

  if (erroAssinatura) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 text-white">
        <section className="w-full max-w-sm rounded-[28px] border border-red-400/15 bg-white/[0.06] p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
            <AlertTriangle
              size={25}
            />
          </div>

          <h1 className="mt-4 text-xl font-extrabold">
            Não foi possível verificar
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {erroAssinatura}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 font-bold text-slate-950"
          >
            <RefreshCw
              size={17}
            />

            Tentar novamente
          </button>

          <button
            type="button"
            onClick={fazerLogout}
            className="mt-3 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 font-bold text-white"
          >
            <LogOut
              size={17}
            />

            Sair
          </button>
        </section>
      </main>
    );
  }

  if (!acessoAtivo) {
    return (
      <main className="min-h-screen bg-[#020b18]" />
    );
  }

  if (!loja || erroLoja) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <section className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle
              size={25}
            />
          </div>

          <h1 className="mt-4 text-xl font-extrabold">
            Loja não vinculada
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {erroLoja ||
              "Este usuário ainda não possui uma loja vinculada."}
          </p>

          <div className="mt-5 rounded-2xl bg-zinc-100 p-3 text-left">
            <div className="flex items-center gap-2">
              <Store size={16} />

              <p className="text-xs font-bold">
                Usuário conectado
              </p>
            </div>

            <p className="mt-1 break-all text-xs text-zinc-500">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={fazerLogout}
            className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 font-bold text-white"
          >
            <LogOut size={17} />
            Sair
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      {mostrarAvisoTeste && (
        <aside
          className={`relative z-[190] border-b px-4 py-3 ${
            avisoUrgente
              ? "border-red-300/20 bg-red-950 text-red-50"
              : avisoAtencao
                ? "border-amber-300/20 bg-amber-950 text-amber-50"
                : "border-sky-300/20 bg-sky-950 text-sky-50"
          }`}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  avisoUrgente
                    ? "bg-red-400/15 text-red-300"
                    : avisoAtencao
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-sky-400/15 text-sky-300"
                }`}
              >
                {avisoUrgente ? (
                  <AlertTriangle
                    size={20}
                  />
                ) : (
                  <Clock3 size={20} />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-black">
                  {diasRestantesTeste ===
                  1
                    ? "Último dia do seu teste grátis"
                    : `Seu teste termina em ${diasRestantesTeste} dias`}
                </p>

                <p className="mt-1 text-xs leading-5 opacity-75">
                  {testeFim
                    ? `Acesso gratuito até ${formatarDataTeste(
                        testeFim
                      )}. Escolha um plano para manter sua loja online.`
                    : "Escolha um plano para manter sua loja online."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={abrirPlanos}
              className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Escolher plano
              <ArrowRight size={17} />
            </button>
          </div>
        </aside>
      )}

      {children}

      <button
        type="button"
        onClick={fazerLogout}
        title="Sair"
        className="logout-button fixed bottom-4 right-4 z-[200] flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl"
      >
        <LogOut
          size={20}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>
    </>
  );
}
