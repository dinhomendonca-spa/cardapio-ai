"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Store,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

export default function RedefinirSenhaPage() {
  const router =
    useRouter();

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    mostrarConfirmacao,
    setMostrarConfirmacao,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    sessaoValida,
    setSessaoValida,
  ] = useState(false);

  const [
    sucesso,
    setSucesso,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    let ativo =
      true;

    const verificarSessao =
      async () => {
        try {
          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          if (!ativo) {
            return;
          }

          if (
            error ||
            !data.session
          ) {
            setSessaoValida(
              false
            );

            return;
          }

          setSessaoValida(
            true
          );
        } finally {
          if (ativo) {
            setCarregando(
              false
            );
          }
        }
      };

    verificarSessao();

    const {
      data:
        authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (
            event ===
              "PASSWORD_RECOVERY" ||
            session
          ) {
            setSessaoValida(
              true
            );

            setCarregando(
              false
            );
          }
        }
      );

    return () => {
      ativo =
        false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  const redefinirSenha =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setErro(null);

      if (
        senha.length < 6
      ) {
        setErro(
          "A nova senha precisa ter pelo menos 6 caracteres."
        );

        return;
      }

      if (
        senha !==
        confirmarSenha
      ) {
        setErro(
          "As senhas não são iguais."
        );

        return;
      }

      try {
        setSalvando(true);

        const {
          error,
        } =
          await supabase.auth.updateUser(
            {
              password:
                senha,
            }
          );

        if (error) {
          throw error;
        }

        setSucesso(true);

        await supabase.auth.signOut();

        setTimeout(
          () => {
            router.replace(
              "/login?senha=alterada"
            );
          },
          1200
        );
      } catch (error) {
        console.error(
          "Erro ao redefinir senha:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível alterar sua senha."
        );
      } finally {
        setSalvando(false);
      }
    };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18]">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-4 text-sm text-slate-400">
            Validando seu link...
          </p>
        </div>
      </main>
    );
  }

  if (!sessaoValida) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 text-white">
        <div className="w-full max-w-sm rounded-[28px] border border-red-400/20 bg-red-400/[0.06] p-6 text-center">
          <KeyRound
            size={34}
            className="mx-auto text-red-300"
          />

          <h1 className="mt-4 text-xl font-black">
            Link inválido ou expirado
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Solicite um novo link de
            recuperação de senha.
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace(
                "/recuperar-senha"
              )
            }
            className="mt-5 h-12 w-full rounded-2xl bg-white font-bold text-slate-950"
          >
            Solicitar novo link
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-sm flex-col justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_14px_45px_rgba(14,165,233,0.35)]">
          <Store
            size={25}
          />
        </div>

        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
          Visite Minha Loja
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          Crie uma nova senha
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Escolha uma nova senha para
          acessar sua conta.
        </p>

        {sucesso ? (
          <div className="mt-8 rounded-[28px] border border-emerald-400/20 bg-emerald-400/[0.08] p-6 text-center">
            <CheckCircle2
              size={38}
              className="mx-auto text-emerald-400"
            />

            <h2 className="mt-4 text-xl font-black">
              Senha alterada!
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Redirecionando para o
              login...
            </p>
          </div>
        ) : (
          <form
            onSubmit={
              redefinirSenha
            }
            className="mt-8 rounded-[28px] bg-white p-4 text-slate-950 shadow-2xl"
          >
            <div>
              <label
                htmlFor="senha"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                Nova senha
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
                  autoComplete="new-password"
                  value={senha}
                  onChange={(
                    event
                  ) => {
                    setSenha(
                      event.target.value
                    );

                    if (erro) {
                      setErro(null);
                    }
                  }}
                  placeholder="Mínimo de 6 caracteres"
                  disabled={
                    salvando
                  }
                  className="h-14 w-full rounded-2xl bg-slate-100 pl-11 pr-12 outline-none transition focus:ring-2 focus:ring-sky-300"
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
                >
                  {mostrarSenha ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label
                htmlFor="confirmarSenha"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                Confirmar nova senha
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirmarSenha"
                  type={
                    mostrarConfirmacao
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    confirmarSenha
                  }
                  onChange={(
                    event
                  ) => {
                    setConfirmarSenha(
                      event.target.value
                    );

                    if (erro) {
                      setErro(null);
                    }
                  }}
                  placeholder="Digite novamente"
                  disabled={
                    salvando
                  }
                  className="h-14 w-full rounded-2xl bg-slate-100 pl-11 pr-12 outline-none transition focus:ring-2 focus:ring-sky-300"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarConfirmacao(
                      (atual) =>
                        !atual
                    )
                  }
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500"
                >
                  {mostrarConfirmacao ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>
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
                salvando
              }
              className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-slate-950 px-5 font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              <span>
                {salvando
                  ? "Salvando..."
                  : "Alterar minha senha"}
              </span>

              {salvando ? (
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
      </div>
    </main>
  );
}