"use client";

import Link from "next/link";
import {
  Building2,
  ChevronRight,
  CreditCard,
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
    descricao: "Nome, logo, banner e endereço",
    icone: Building2,
    href: "/admin/loja",
  },
  {
    titulo: "Produtos",
    descricao: "Cadastrar e editar o cardápio",
    icone: Package,
    href: "/admin/produtos",
  },
  {
    titulo: "Pedidos",
    descricao: "Visualizar pedidos recebidos",
    icone: LayoutDashboard,
    href: "/admin/pedidos",
  },
  {
    titulo: "Pagamento",
    descricao: "Chave Pix e configurações",
    icone: CreditCard,
    href: "/admin/pagamento",
  },
  {
    titulo: "Entrega",
    descricao: "Taxa, retirada e regiões atendidas",
    icone: Smartphone,
    href: "/admin/entrega",
  },
  {
    titulo: "Configurações",
    descricao: "WhatsApp e preferências da loja",
    icone: Settings,
    href: "/admin/configuracoes",
  },
];

export default function AdminPage() {
  const { loja, carregando } = useStore();

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="bg-zinc-950 px-5 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">
                Painel do comerciante
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                {carregando
                  ? "Carregando..."
                  : loja?.nome || "Sua loja"}
              </h1>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Store size={22} />
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white/10 p-4">
            <p className="text-sm text-zinc-300">
              Status da loja
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  loja?.ativo ? "bg-green-400" : "bg-zinc-500"
                }`}
              />

              <span className="font-semibold">
                {loja?.ativo
                  ? "Cardápio online"
                  : "Cardápio offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto -mt-5 max-w-md px-4 pb-10">
        <div className="grid gap-3">
          {itens.map(
            ({ titulo, descricao, icone: Icon, href }) => (
              <Link
                key={titulo}
                href={href}
                className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold">{titulo}</h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {descricao}
                  </p>
                </div>

                <ChevronRight
                  size={20}
                  className="text-zinc-400"
                />
              </Link>
            )
          )}
        </div>
      </section>
    </main>
  );
}