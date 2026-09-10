"use client";

import {
  Suspense,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

function ConteudoVerifiqueEmail() {
  const parametros =
    useSearchParams();

  const email =
    parametros.get("email") ?? "";

  const [reenviando, setReenviando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  const reenviarEmail = async () => {
    if (!email) {
      setErro(
        "E-mail não identificado. Volte ao cadastro e tente novamente."
      );
      return;
    }

    setReenviando(true);
    setMensagem("");
    setErro("");

    try {
      const {
        error,
      } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo:
            `${window.location.origin}/login?confirmado=1`,
        },
      });

      if (error) {
        throw error;
      }

      setMensagem(
        "Um novo e-mail de confirmação foi enviado."
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "";

      setErro(
        texto ||
          "Não foi possível reenviar o e-mail agora."
      );
    } finally {
      setReenviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-sky-300/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_18px_60px_rgba(14,165,233,0.35)]">
            <MailCheck size={38} />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              Confirme seu cadastro
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Verifique seu e-mail
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enviamos um link para
              confirmar que você tem
              acesso ao endereço
              cadastrado.
            </p>
          </div>

          {email && (
            <div className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-400/10 p-4 text-center">
              <p className="text-xs text-slate-400">
                E-mail enviado para
              </p>

              <p className="mt-1 break-all text-sm font-bold text-white">
                {email}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {[
              "Abra sua caixa de entrada.",
              "Procure o e-mail do Visite Minha Loja.",
              "Clique no link de confirmação.",
              "Depois, entre na sua conta.",
            ].map(
              (item, indice) => (
                <div
                  key={item}
                  className="flex items-start gap-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-black text-emerald-300">
                    {indice + 1}
                  </span>

                  <p className="pt-1 text-sm text-slate-300">
                    {item}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/[0.05] p-4">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <p className="text-xs leading-5 text-slate-400">
              Nenhuma cobrança será
              realizada antes da
              confirmação do e-mail e
              da sua autorização.
            </p>
          </div>

          {mensagem && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-300"
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
              {mensagem}
            </div>
          )}

          {erro && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-semibold text-red-300"
            >
              {erro}
            </div>
          )}

          <Link
            href="/login"
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-sky-100"
          >
            Já confirmei meu e-mail
          </Link>

          <button
            type="button"
            onClick={reenviarEmail}
            disabled={
              reenviando || !email
            }
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reenviando ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Reenviando...
              </>
            ) : (
              <>
                <RefreshCw size={17} />
                Reenviar e-mail
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Confira também as pastas de
            spam e lixo eletrônico.
          </p>
        </div>

        <Link
          href="/cadastro"
          className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar ao cadastro
        </Link>
      </div>
    </main>
  );
}

function CarregandoPagina() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020b18] text-white">
      <LoaderCircle
        size={32}
        className="animate-spin text-sky-400"
      />
    </main>
  );
}

export default function VerifiqueEmailPage() {
  return (
    <Suspense
      fallback={<CarregandoPagina />}
    >
      <ConteudoVerifiqueEmail />
    </Suspense>
  );
}