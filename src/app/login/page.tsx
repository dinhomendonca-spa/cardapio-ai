"use client";

import {
  Suspense,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  Store,
  UserPlus,
} from "lucide-react";

import {
  type PlanoCadastro,
  useAuth,
} from "@/context/AuthContext";

type RespostaStatus = {
  status: string;
  ativo: boolean;
  tipoAcesso?: string;
  testeDisponivel?: boolean;
  erro?: string;
};

function normalizarPlano(
  valor: string | null
): PlanoCadastro {
  if (valor === "anual") {
    return "anual";
  }

  if (valor === "mensal") {
    return "mensal";
  }

  return "teste";
}

function LoginConteudo() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    user,
    session,
    carregandoAuth,
    entrar,
  } = useAuth();

  const plano =
    normalizarPlano(
      searchParams.get("plano")
    );

  const retornoConfirmacao =
    searchParams.get(
      "confirmado"
    ) === "1";

  const emailConfirmado =
    retornoConfirmacao &&
    Boolean(
      user?.email_confirmed_at
    );

  const senhaAlterada =
    searchParams.get(
      "senha"
    ) === "alterada";

  const verificacaoIniciada =
    useRef(false);

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    entrando,
    setEntrando,
  ] = useState(false);

  const [
    verificandoAcesso,
    setVerificandoAcesso,
  ] = useState(false);

  const [
    loginRealizado,
    setLoginRealizado,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (retornoConfirmacao) {
      verificacaoIniciada.current =
        false;

      setVerificandoAcesso(false);
      setEntrando(false);
      setErro(null);
    }
  }, [retornoConfirmacao]);

  useEffect(() => {
    if (
      retornoConfirmacao &&
      !loginRealizado
    ) {
      return;
    }

    if (
      carregandoAuth ||
      !user ||
      !session?.access_token ||
      verificacaoIniciada.current
    ) {
      return;
    }

    verificacaoIniciada.current =
      true;

    let cancelado = false;

    const verificarDestino =
      async () => {
        setVerificandoAcesso(
          true
        );

        setErro(null);

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
                "Não foi possível verificar sua assinatura."
            );
          }

          if (cancelado) {
            return;
          }

          if (resultado.ativo) {
            router.replace(
              "/admin"
            );

            return;
          }

          router.replace(
            `/assinar?plano=${plano}`
          );
        } catch (error) {
          if (cancelado) {
            return;
          }

          verificacaoIniciada.current =
            false;

          setVerificandoAcesso(
            false
          );

          setEntrando(false);

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível verificar seu acesso."
          );
        }
      };

    verificarDestino();

    return () => {
      cancelado = true;
    };
  }, [
    user,
    session?.access_token,
    carregandoAuth,
    router,
    plano,
    retornoConfirmacao,
    loginRealizado,
  ]);

  const fazerLogin = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErro(null);

    const emailNormalizado =
      email
        .trim()
        .toLowerCase();

    if (!emailNormalizado) {
      setErro(
        "Informe seu e-mail."
      );

      return;
    }

    if (!senha) {
      setErro(
        "Informe sua senha."
      );

      return;
    }

    try {
      setEntrando(true);

      verificacaoIniciada.current =
        false;

      await entrar(
        emailNormalizado,
        senha
      );

      setLoginRealizado(true);
    } catch (error) {
      console.error(
        "Erro ao entrar:",
        error
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : "";

      const normalizada =
        mensagem.toLowerCase();

      const naoConfirmado =
        normalizada.includes(
          "email not confirmed"
        ) ||
        normalizada.includes(
          "not confirmed"
        );

      const credenciaisInvalidas =
        normalizada.includes(
          "invalid login credentials"
        ) ||
        normalizada.includes(
          "invalid credentials"
        );

      if (naoConfirmado) {
        setErro(
          "Seu cadastro existe, mas o e-mail ainda não foi confirmado. Use a opção de reenviar a confirmação."
        );
      } else if (
        credenciaisInvalidas
      ) {
        setErro(
          "E-mail ou senha incorretos. Confira os dados digitados ou recupere sua senha."
        );
      } else {
        setErro(
          mensagem ||
            "Não foi possível entrar agora. Tente novamente."
        );
      }

      setEntrando(false);
      setLoginRealizado(false);
    }
  };

  const linkCadastro =
    `/cadastro?plano=${plano}`;

  const parametrosReenvio =
    new URLSearchParams({
      plano,
    });

  if (email.trim()) {
    parametrosReenvio.set(
      "email",
      email
        .trim()
        .toLowerCase()
    );
  }

  const linkReenvio =
    `/verifique-email?${parametrosReenvio.toString()}`;

  const parametrosRecuperacao =
    new URLSearchParams();

  if (email.trim()) {
    parametrosRecuperacao.set(
      "email",
      email
        .trim()
        .toLowerCase()
    );
  }

  const linkRecuperacao =
    parametrosRecuperacao.toString()
      ? `/recuperar-senha?${parametrosRecuperacao.toString()}`
      : "/recuperar-senha";

  if (
    carregandoAuth ||
    verificandoAcesso
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18]">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-4 text-sm text-slate-400">
            Verificando seu acesso...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-sm flex-col justify-center">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_14px_45px_rgba(14,165,233,0.35)]">
            <Store size={25} />
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Visite Minha Loja
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Acesse sua conta
          </h1>

          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
            Entre para começar seu teste
            ou administrar sua loja.
          </p>
        </div>

        {senhaAlterada && (
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>
                <p className="text-sm font-black text-emerald-300">
                  Senha alterada
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Sua nova senha foi
                  salva. Você já pode
                  entrar normalmente.
                </p>
              </div>
            </div>
          </div>
        )}

        {emailConfirmado && (
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4">
            <div className="flex items-start gap-3">
              <MailCheck
                size={21}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>
                <p className="text-sm font-black text-emerald-300">
                  E-mail confirmado!
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Seu cadastro foi
                  confirmado. Digite seu
                  e-mail e a senha criada
                  no cadastro para
                  continuar.
                </p>
              </div>
            </div>
          </div>
        )}

        {plano === "teste" && (
          <div className="mt-4 rounded-3xl border border-sky-400/20 bg-sky-400/[0.08] p-4">
            <div className="flex items-start gap-3">
              <Gift
                size={22}
                className="mt-0.5 shrink-0 text-sky-300"
              />

              <div>
                <p className="text-sm font-black text-sky-200">
                  Seus 30 dias estão
                  reservados
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Entre para ativar seu
                  teste. Você não precisa
                  informar cartão.
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={fazerLogin}
          noValidate
          className="mt-8 rounded-[28px] bg-white p-4 text-slate-950 shadow-2xl"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              E-mail
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );

                  if (erro) {
                    setErro(null);
                  }
                }}
                placeholder="voce@empresa.com"
                disabled={entrando}
                className="h-14 w-full rounded-2xl bg-slate-100 pl-11 pr-4 text-base outline-none transition focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="senha"
                className="block text-xs font-bold text-slate-700"
              >
                Senha
              </label>

              <Link
                href={linkRecuperacao}
                className="text-xs font-bold text-sky-600 transition hover:text-sky-700"
              >
                Esqueci minha senha
              </Link>
            </div>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="senha"
                name="senha"
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={senha}
                onChange={(event) => {
                  setSenha(
                    event.target.value
                  );

                  if (erro) {
                    setErro(null);
                  }
                }}
                placeholder="Sua senha"
                disabled={entrando}
                className="h-14 w-full rounded-2xl bg-slate-100 pl-11 pr-12 text-base outline-none transition focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (atual) =>
                      !atual
                  )
                }
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500"
                aria-label={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3"
            >
              <p className="text-xs font-semibold leading-5 text-red-700">
                {erro}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={entrando}
            className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-slate-950 px-5 font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            <span>
              {entrando
                ? "Entrando..."
                : plano === "teste"
                  ? "Entrar e começar meu teste"
                  : "Entrar e continuar"}
            </span>

            {entrando ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <ArrowRight
                size={19}
              />
            )}
          </button>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-500"
              />

              <p className="text-xs leading-5 text-slate-600">
                {plano === "teste"
                  ? "Depois de entrar, você poderá ativar 30 dias gratuitos. Nenhuma cobrança será criada."
                  : "Se sua assinatura já estiver ativa, você será levado diretamente ao painel. Caso contrário, continuará para a contratação."}
              </p>
            </div>
          </div>
        </form>

        <div className="mt-4 grid gap-3">
          <Link
            href={linkRecuperacao}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-400/[0.06] text-xs font-bold text-sky-200 transition hover:bg-sky-400/10"
          >
            <KeyRound
              size={16}
            />

            Recuperar minha senha
          </Link>

          <Link
            href={linkCadastro}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sm font-bold text-sky-200 transition hover:bg-sky-400/15"
          >
            <UserPlus
              size={18}
            />

            Criar minha conta
          </Link>

          <Link
            href={linkReenvio}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-bold text-slate-300 transition hover:bg-white/[0.08]"
          >
            <Mail size={16} />

            Não recebi a confirmação
          </Link>
        </div>

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          Se você já iniciou seu
          cadastro, não precisa criar
          outra conta.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020b18]">
          <div className="text-center">
            <Loader2
              size={34}
              className="mx-auto animate-spin text-sky-400"
            />

            <p className="mt-4 text-sm text-slate-400">
              Carregando...
            </p>
          </div>
        </main>
      }
    >
      <LoginConteudo />
    </Suspense>
  );
}
