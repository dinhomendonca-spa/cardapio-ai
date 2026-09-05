"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  Save,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useStore } from "@/context/StoreContext";
import { supabase } from "@/lib/supabase";

export default function PagamentoAdminPage() {
  const {
    loja,
    carregando,
    recarregarLoja,
  } = useStore();

  const [chavePix, setChavePix] =
    useState("");

  const [salvando, setSalvando] =
    useState(false);

  const [salvo, setSalvo] =
    useState(false);

  const [copiado, setCopiado] =
    useState(false);

  useEffect(() => {
    if (!loja) {
      return;
    }

    setChavePix(
      loja.chave_pix || ""
    );
  }, [loja]);

  const salvarPix = async () => {
    if (!loja) {
      alert(
        "Não foi possível identificar a loja."
      );

      return;
    }

    if (!chavePix.trim()) {
      alert(
        "Informe uma chave Pix."
      );

      return;
    }

    try {
      setSalvando(true);
      setSalvo(false);

      const { error } =
        await supabase
          .from("lojas")
          .update({
            chave_pix:
              chavePix.trim(),
          })
          .eq("id", loja.id);

      if (error) {
        throw error;
      }

      await recarregarLoja();

      setSalvo(true);

      setTimeout(() => {
        setSalvo(false);
      }, 3000);
    } catch (error) {
      console.error(
        "Erro ao salvar Pix:",
        error
      );

      alert(
        "Não foi possível salvar a chave Pix."
      );
    } finally {
      setSalvando(false);
    }
  };

  const copiarChave = async () => {
    if (!chavePix.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        chavePix.trim()
      );

      setCopiado(true);

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      alert(
        "Não foi possível copiar a chave."
      );
    }
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2
          size={28}
          className="animate-spin text-zinc-500"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 active:scale-95"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-[11px] text-zinc-500">
              {loja?.nome ||
                "Sua loja"}
            </p>

            <h1 className="text-lg font-extrabold">
              Pagamento
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        {/* INTRO */}
        <section className="rounded-3xl bg-zinc-950 p-5 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <CreditCard
                size={20}
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Recebimentos
              </p>

              <h2 className="mt-1 text-lg font-extrabold">
                Configure seu Pix
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-300">
                Essa chave será usada para gerar o QR Code e o Pix copia e cola dos pedidos.
              </p>
            </div>
          </div>
        </section>

        {/* CHAVE */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <KeyRound
                size={18}
              />
            </div>

            <div>
              <h2 className="font-extrabold">
                Chave Pix
              </h2>

              <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                Pode ser CPF, CNPJ, telefone, e-mail ou chave aleatória.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="chavePix"
              className="mb-1.5 block text-xs font-bold text-zinc-700"
            >
              Chave Pix *
            </label>

            <input
              id="chavePix"
              type="text"
              value={chavePix}
              onChange={(e) =>
                setChavePix(
                  e.target.value
                )
              }
              placeholder="Digite a chave Pix"
              autoComplete="off"
              className="h-14 w-full rounded-2xl border border-transparent bg-zinc-100 px-4 text-base outline-none focus:border-zinc-300 focus:bg-white"
            />
          </div>

          {chavePix.trim() && (
            <button
              type="button"
              onClick={copiarChave}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-sm font-bold"
            >
              {copiado ? (
                <>
                  <CheckCircle2
                    size={17}
                  />

                  Copiado
                </>
              ) : (
                <>
                  <Copy
                    size={17}
                  />

                  Copiar chave
                </>
              )}
            </button>
          )}
        </section>

        {/* AVISO */}
        <section className="rounded-3xl bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            Importante
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            Confira a chave com atenção. Os clientes usarão essa informação para fazer o pagamento diretamente para o estabelecimento.
          </p>
        </section>

        {/* SALVO */}
        {salvo && (
          <section className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-800">
            <CheckCircle2
              size={20}
            />

            <div>
              <p className="text-sm font-bold">
                Chave Pix salva
              </p>

              <p className="text-xs">
                Os próximos pedidos já utilizarão essa chave.
              </p>
            </div>
          </section>
        )}

        {/* SALVAR */}
        <button
          type="button"
          onClick={salvarPix}
          disabled={salvando}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 font-bold text-white shadow-lg active:scale-[0.99] disabled:opacity-60"
        >
          {salvando ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Salvando...
            </>
          ) : (
            <>
              <Save
                size={18}
              />

              Salvar chave Pix
            </>
          )}
        </button>
      </section>
    </main>
  );
}