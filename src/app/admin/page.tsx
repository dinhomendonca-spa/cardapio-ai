"use client";

import Link from "next/link";

import {
  Building2,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  Smartphone,
  Store,
} from "lucide-react";

import { useStore } from "@/context/StoreContext";

const itens = [
  {
    titulo: "Dados da loja",
    descricao:
      "Nome, logo, banner e endereço",
    icone: Building2,
    href: "/admin/loja",
  },

  {
    titulo: "Produtos",
    descricao:
      "Cadastrar e editar o cardápio",
    icone: Package,
    href: "/admin/produtos",
  },

  {
    titulo: "Pedidos",
    descricao:
      "Visualizar pedidos recebidos",
    icone: LayoutDashboard,
    href: "/admin/pedidos",
  },

  {
    titulo: "Pagamento",
    descricao:
      "Chave Pix e configurações",
    icone: CreditCard,
    href: "/admin/pagamento",
  },

  {
    titulo: "Horário do cardápio",
    descricao:
      "Definir abertura e fechamento",
    icone: Clock3,
    href: "/admin/horarios",
  },

  {
    titulo: "Entrega",
    descricao:
      "Taxa, retirada e regiões atendidas",
    icone: Smartphone,
    href: "/admin/entrega",
  },

  {
    titulo: "Configurações",
    descricao:
      "WhatsApp e preferências da loja",
    icone: Settings,
    href: "/admin/configuracoes",
  },
];

export default function AdminPage() {
  const {
    loja,
    carregando,
  } = useStore();

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-950" />

          <p className="mt-3 text-sm text-zinc-500">
            Carregando painel...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="bg-zinc-950 px-5 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-zinc-400">
                Painel do comerciante
              </p>

              <h1 className="mt-1 truncate text-2xl font-bold">
                {loja?.nome ||
                  "Sua loja"}
              </h1>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Store
                size={22}
              />
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white/10 p-4">
            <p className="text-sm text-zinc-300">
              Status do sistema
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  loja?.ativo
                    ? "bg-green-400"
                    : "bg-red-400"
                }`}
              />

              <span className="font-semibold">
                {loja?.ativo
                  ? "Cardápio online"
                  : "Cardápio desativado"}
              </span>
            </div>
          </div>

          {loja?.slug && (
            <Link
              href={`/loja/${loja.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 active:scale-[0.99]"
            >
              <ExternalLink
                size={17}
              />

              Ver meu cardápio
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto -mt-5 max-w-md px-4 pb-10">
        <div className="grid gap-3">
          {itens.map(
            ({
              titulo,
              descricao,
              icone:
                Icon,
              href,
            }) => (
              <Link
                key={
                  href
                }
                href={
                  href
                }
                className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                  <Icon
                    size={
                      21
                    }
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold">
                    {
                      titulo
                    }
                  </h2>

                  <p className="mt-0.5 text-sm leading-5 text-zinc-500">
                    {
                      descricao
                    }
                  </p>
                </div>

                <ChevronRight
                  size={20}
                  className="shrink-0 text-zinc-300"
                />
              </Link>
            )
          )}
        </div>
      </section>
    </main>
  );
}