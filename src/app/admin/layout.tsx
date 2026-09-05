"use client";

import {
  AlertTriangle,
  Loader2,
  LogOut,
  Store,
} from "lucide-react";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  useStore,
} from "@/context/StoreContext";

export default function AdminLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const {
    user,
    carregandoAuth,
    sair,
  } = useAuth();

  const {
    loja,
    carregando,
    erroLoja,
  } = useStore();

  useEffect(() => {
    if (
      !carregandoAuth &&
      !user
    ) {
      router.replace(
        "/login"
      );
    }
  }, [
    user,
    carregandoAuth,
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

  if (
    carregandoAuth ||
    (
      user &&
      carregando
    )
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin"
          />

          <p className="mt-3 text-sm font-medium text-zinc-500">
            Carregando painel...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-950" />
    );
  }

  if (
    !loja ||
    erroLoja
  ) {
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
              <Store
                size={16}
              />

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
            onClick={
              fazerLogout
            }
            className="mt-4 flex h-13 min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 font-bold text-white"
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

  return (
    <>
      {children}

      <button
        type="button"
        onClick={
          fazerLogout
        }
        title="Sair"
        className="fixed bottom-4 right-4 z-[200] flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-xl ring-1 ring-zinc-200"
      >
        <LogOut
          size={18}
        />
      </button>
    </>
  );
}