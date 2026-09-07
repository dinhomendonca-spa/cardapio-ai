"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";

export default function LoginPage() {
  const router =
    useRouter();

  const {
    user,
    carregandoAuth,
    entrar,
  } = useAuth();

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
    erro,
    setErro,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      !carregandoAuth &&
      user
    ) {
      router.replace(
        "/admin"
      );
    }
  }, [
    user,
    carregandoAuth,
    router,
  ]);

  const fazerLogin =
    async (
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

        router.replace(
          "/admin"
        );
      } catch (error) {
        console.error(
          "Erro ao entrar:",
          error
        );

        setErro(
          "E-mail ou senha incorretos."
        );
      } finally {
        setEntrando(
          false
        );
      }
    };

  if (carregandoAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2
          size={30}
          className="animate-spin text-white"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-sm flex-col justify-center">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-lg">
            <Store
              size={25}
            />
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            LOJAS AI
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Painel do comerciante
          </h1>

          <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">
            Entre para administrar sua loja, produtos e pedidos.
          </p>
        </div>

        <form
          onSubmit={
            fazerLogin
          }
          className="mt-8 rounded-[28px] bg-white p-4 text-zinc-950 shadow-2xl"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-bold text-zinc-700"
            >
              E-mail
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                placeholder="voce@empresa.com"
                className="h-14 w-full rounded-2xl bg-zinc-100 pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>
          </div>

          <div className="mt-3">
            <label
              htmlFor="senha"
              className="mb-1.5 block text-xs font-bold text-zinc-700"
            >
              Senha
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
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
                onChange={(
                  event
                ) =>
                  setSenha(
                    event.target
                      .value
                  )
                }
                placeholder="Sua senha"
                className="h-14 w-full rounded-2xl bg-zinc-100 pl-11 pr-12 text-base outline-none focus:ring-2 focus:ring-zinc-300"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (
                      atual
                    ) =>
                      !atual
                  )
                }
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500"
              >
                {mostrarSenha ? (
                  <EyeOff
                    size={
                      18
                    }
                  />
                ) : (
                  <Eye
                    size={
                      18
                    }
                  />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div className="mt-3 rounded-2xl bg-red-50 p-3">
              <p className="text-xs font-medium leading-5 text-red-700">
                {erro}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              entrando
            }
            className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 font-bold text-white disabled:opacity-60"
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

        <p className="mt-5 text-center text-[11px] leading-5 text-zinc-500">
          Acesso exclusivo para estabelecimentos cadastrados.
        </p>
      </div>
    </main>
  );
}