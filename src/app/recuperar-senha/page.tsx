"use client";

import {
  Suspense,
  type FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  useSearchParams,
} from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Store,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

function RecuperarSenhaConteudo() {
  const searchParams =
    useSearchParams();

  const emailInicial =
    searchParams.get(
      "email"
    ) ?? "";

  const [
    email,
    setEmail,
  ] = useState(
    emailInicial
  );

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    enviado,
    setEnviado,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState<string | null>(
    null
  );

  const recuperarSenha =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setErro(null);

      const emailNormalizado =
        email
          .trim()
          .toLowerCase();

      if (
        !emailNormalizado ||
        !emailNormalizado.includes(
          "@"
        )
      ) {
        setErro(
          "Digite um e-mail válido."
        );

        return;
      }

      try {
        setEnviando(true);

        const redirectTo =
          `${window.location.origin}/redefinir-senha`;

        const {
          error,
        } =
          await supabase.auth.resetPasswordForEmail(
            emailNormalizado,
            {
              redirectTo,
            }
          );

        if (error) {
          throw error;
        }

        setEnviado(true);
      } catch (error) {
        console.error(
          "Erro ao recuperar senha:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o e-mail de recuperação."
        );
      } finally {
        setEnviando(false);
      }
    };

  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-sm flex-col justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_14px_45px_rgba(14,165,233,0.35)]">
          <Store size={25} />
        </div>

        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
          Visite Minha Loja
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          Recuperar senha
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Informe o e-mail cadastrado.
          Enviaremos um link para você
          criar uma nova senha.
        </p>

        {enviado ? (
          <div className="mt-8 rounded-[28px] border border-emerald-400/20 bg-emerald-400/[0.08] p-5">
            <CheckCircle2
              size={30}
              className="text-emerald-400"
            />

            <h2 className="mt-4 text-lg font-black text-white">
              Verifique seu e-mail
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Se existir uma conta
              cadastrada com esse e-mail,
              você receberá as instruções
              para alterar sua senha.
            </p>

            <Link
              href="/login"
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-slate-950"
            >
              <ArrowLeft
                size={17}
              />

              Voltar ao login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={
              recuperarSenha
            }
            className="mt-8 rounded-[28px] bg-white p-4 text-slate-950 shadow-2xl"
          >
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
                autoComplete="email"
                value={email}
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target.value
                  );

                  if (erro) {
                    setErro(null);
                  }
                }}
                placeholder="voce@empresa.com"
                disabled={enviando}
                className="h-14 w-full rounded-2xl bg-slate-100 pl-11 pr-4 text-base outline-none transition focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
              />
            </div>

            {erro && (
              <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-semibold leading-5 text-red-700">
                  {erro}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                enviando
              }
              className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-slate-950 px-5 font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              <span>
                {enviando
                  ? "Enviando..."
                  : "Enviar link de recuperação"}
              </span>

              {enviando ? (
                <Loader2
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <KeyRound
                  size={19}
                />
              )}
            </button>
          </form>
        )}

        {!enviado && (
          <Link
            href="/login"
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-300"
          >
            <ArrowLeft
              size={17}
            />

            Voltar ao login
          </Link>
        )}
      </div>
    </main>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020b18]">
          <Loader2
            size={34}
            className="animate-spin text-sky-400"
          />
        </main>
      }
    >
      <RecuperarSenhaConteudo />
    </Suspense>
  );
}