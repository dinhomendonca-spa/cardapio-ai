"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
  UserPlus,
} from "lucide-react";

import {
  useAuth,
} from "@/context/AuthContext";

type RespostaStatus = {
  status: string;
  ativo: boolean;
  erro?: string;
};

export default function LoginPage() {
  const router =
    useRouter();

  const {
    user,
    session,
    carregandoAuth,
    entrar,
  } = useAuth();

  const verificacaoIniciada =
    useRef(false);

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

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
    erro,
    setErro,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
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
        setVerificandoAcesso(true);
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

          router.replace(
            resultado.ativo
              ? "/admin"
              : "/assinar"
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
  ]);

  const fazerLogin = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setErro(null);

    if (
      !email.trim() ||
      !senha
    ) {
      setErro(
        "Informe e-mail e senha."
      );
      return;
    }

    try {
      setEntrando(true);

      await entrar(
        email,
        senha
      );
    } catch (error) {
      console.error(
        "Erro ao entrar:",
        error
      );

      setErro(
        "E-mail ou senha incorretos, ou o e-mail ainda não foi confirmado."
      );

      setEntrando(false);
    }
  };

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
            Painel do comerciante
          </h1>

          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
            Entre para administrar sua
            loja, produtos e pedidos.
          </p>
        </div>

        <form
          onSubmit={fazerLogin}
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
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="voce@empresa.com"
                disabled={entrando}
                className="h-14 w-full rounded-2xl bg-slate-100 pl-11 pr-4 text-base outline-none transition focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-3">
            <label
              htmlFor="senha"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Senha
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="senha"
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={senha}
                onChange={(event) =>
                  setSenha(
                    event.target.value
                  )
                }
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
              className="mt-3 rounded-2xl bg-red-50 p-3"
            >
              <p className="text-xs font-medium leading-5 text-red-700">
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
                : "Entrar"}
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
        </form>

        <Link
          href="/cadastro"
          className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sm font-bold text-sky-200 transition hover:bg-sky-400/15"
        >
          <UserPlus size={18} />
          Criar minha conta
        </Link>

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          Acesso exclusivo para
          estabelecimentos cadastrados.
        </p>
      </div>
    </main>
  );
}