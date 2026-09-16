"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Palette,
  Save,
  Settings,
  Store,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  type TemaLoja,
  useStore,
} from "@/context/StoreContext";

const TEMAS: Array<{
  id: TemaLoja;
  nome: string;
  cor: string;
}> = [
  { id: "azul-escuro", nome: "Azul-escuro", cor: "#06111f" },
  { id: "nude", nome: "Nude", cor: "#e8c6ae" },
  { id: "rosa-claro", nome: "Rosa-claro", cor: "#f8dbe7" },
  { id: "branco", nome: "Branco", cor: "#ffffff" },
  { id: "verde", nome: "Verde", cor: "#0b4638" },
  { id: "vermelho", nome: "Vermelho", cor: "#7f1d1d" },
  { id: "preto", nome: "Preto", cor: "#090909" },
];

export default function ConfiguracoesPage() {
  const {
    loja,
    carregando,
    salvarLoja,
  } = useStore();

  const [
    whatsapp,
    setWhatsapp,
  ] = useState("");

  const [
    lojaAtiva,
    setLojaAtiva,
  ] = useState(true);

  const [
    retiradaPermitida,
    setRetiradaPermitida,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    salvo,
    setSalvo,
  ] = useState(false);

  const [temaAdmin, setTemaAdmin] =
    useState<TemaLoja>("azul-escuro");

  const [temaLoja, setTemaLoja] =
    useState<TemaLoja>("azul-escuro");

  useEffect(() => {
    if (!loja) {
      return;
    }

    setWhatsapp(
      loja.whatsapp || ""
    );

    setLojaAtiva(
      loja.ativo ?? true
    );

    setRetiradaPermitida(
      loja.retirada_permitida ??
        true
    );

    setTemaAdmin(
      loja.tema_admin ??
        "azul-escuro"
    );

    setTemaLoja(
      loja.tema_loja ??
        "azul-escuro"
    );
  }, [
    loja,
  ]);

  const normalizarTelefone = (
    valor: string
  ) => {
    return valor.replace(
      /[^\d+]/g,
      ""
    );
  };

  const salvar =
    async () => {
      if (!loja) {
        alert(
          "Não foi possível identificar a loja."
        );

        return;
      }

      const telefone =
        normalizarTelefone(
          whatsapp.trim()
        );

      if (!telefone) {
        alert(
          "Informe o WhatsApp da loja."
        );

        return;
      }

      const numeros =
        telefone.replace(
          /\D/g,
          ""
        );

      if (
        numeros.length <
        10
      ) {
        alert(
          "Informe um WhatsApp válido com DDD."
        );

        return;
      }

      try {
        setSalvando(
          true
        );

        setSalvo(
          false
        );

        await salvarLoja({
          whatsapp:
            telefone,

          ativo:
            lojaAtiva,

          retirada_permitida:
            retiradaPermitida,

          tema_admin:
            temaAdmin,

          tema_loja:
            temaLoja,
        });

        setSalvo(
          true
        );

        setTimeout(
          () => {
            setSalvo(
              false
            );
          },
          3000
        );
      } catch (
        error
      ) {
        console.error(
          "Erro ao salvar configurações:",
          error
        );

        alert(
          "Não foi possível salvar as configurações."
        );
      } finally {
        setSalvando(
          false
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
              Configurações
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        <section className="rounded-3xl bg-zinc-950 p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Settings
                size={21}
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Administração
              </p>

              <h2 className="mt-1 text-lg font-extrabold">
                Preferências da loja
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-300">
                Configure as opções gerais do seu estabelecimento.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <MessageCircle
                size={19}
              />
            </div>

            <div>
              <h2 className="font-extrabold">
                WhatsApp
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Número que receberá os pedidos dos clientes.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="whatsapp"
              className="mb-1.5 block text-xs font-bold text-zinc-700"
            >
              WhatsApp da loja
            </label>

            <input
              id="whatsapp"
              type="tel"
              value={
                whatsapp
              }
              onChange={(
                event
              ) =>
                setWhatsapp(
                  event.target
                    .value
                )
              }
              placeholder="Ex: 22999999999"
              className="h-14 w-full rounded-2xl bg-zinc-100 px-4 text-base outline-none focus:ring-2 focus:ring-zinc-300"
            />

            <p className="mt-2 text-[11px] leading-5 text-zinc-500">
              Use DDD + número. Exemplo: 22999999999.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
              <Palette size={19} />
            </div>

            <div>
              <h2 className="font-extrabold">
                Cores do sistema
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Escolha uma cor para seu painel e outra para a loja vista pelos clientes.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold">
              Tema do painel administrativo
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {TEMAS.map((tema) => (
                <button
                  key={`admin-${tema.id}`}
                  type="button"
                  onClick={() => setTemaAdmin(tema.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-xs font-bold transition ${
                    temaAdmin === tema.id
                      ? "border-sky-400 ring-2 ring-sky-400/25"
                      : "border-white/10"
                  }`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-xl border border-black/10 shadow-sm"
                    style={{ backgroundColor: tema.cor }}
                  />
                  {tema.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold">
              Tema da loja para clientes
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {TEMAS.map((tema) => (
                <button
                  key={`loja-${tema.id}`}
                  type="button"
                  onClick={() => setTemaLoja(tema.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-xs font-bold transition ${
                    temaLoja === tema.id
                      ? "border-sky-400 ring-2 ring-sky-400/25"
                      : "border-white/10"
                  }`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-xl border border-black/10 shadow-sm"
                    style={{ backgroundColor: tema.cor }}
                  />
                  {tema.nome}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <Store
                size={18}
              />
            </div>

            <div>
              <h2 className="font-extrabold">
                Loja
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Controle rapidamente a disponibilidade do estabelecimento.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-zinc-100 p-4">
              <div>
                <p className="text-sm font-bold">
                  Loja ativa
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Permite que o estabelecimento apareça no cardápio.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  lojaAtiva
                }
                onChange={(
                  event
                ) =>
                  setLojaAtiva(
                    event.target
                      .checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-zinc-100 p-4">
              <div>
                <p className="text-sm font-bold">
                  Permitir retirada
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Cliente pode retirar o pedido diretamente na loja.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  retiradaPermitida
                }
                onChange={(
                  event
                ) =>
                  setRetiradaPermitida(
                    event.target
                      .checked
                  )
                }
                className="h-5 w-5"
              />
            </label>
          </div>
        </section>

        {salvo && (
          <section className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-800">
            <CheckCircle2
              size={20}
            />

            <div>
              <p className="text-sm font-bold">
                Configurações salvas
              </p>

              <p className="text-xs">
                As alterações já estão valendo.
              </p>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={
            salvar
          }
          disabled={
            salvando
          }
          className="theme-primary-button flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 font-bold shadow-lg disabled:opacity-40"
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

              Salvar configurações
            </>
          )}
        </button>
      </section>
    </main>
  );
}
