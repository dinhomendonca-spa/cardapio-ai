"use client";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/context/ProductContext";

export default function ProdutosPage() {
  const {
    produtos,
    excluirProduto,
    alternarStatus,
  } = useProducts();

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <main className="min-h-screen bg-zinc-100 pb-28 text-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <p className="text-xs text-zinc-500">Painel do comerciante</p>
            <h1 className="text-lg font-bold">Produtos</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Seu cardápio</p>
            <h2 className="text-2xl font-bold">
              {produtos.length} produtos
            </h2>
          </div>

          <Link
            href="/admin/produtos/novo"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white"
          >
            <Plus size={22} />
          </Link>
        </div>

        <div className="space-y-3">
          {produtos.map((produto) => (
            <article
              key={produto.id}
              className="rounded-3xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{produto.nome}</h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        produto.ativo
                          ? "bg-green-50 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {produto.ativo ? "Ativo" : "Oculto"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {produto.categoria}
                  </p>

                  <p className="mt-3 text-lg font-bold">
                    {formatarPreco(produto.preco)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => alternarStatus(produto.id)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-3 py-3 text-sm font-semibold"
                >
                  {produto.ativo ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                  {produto.ativo ? "Ocultar" : "Ativar"}
                </button>

                <Link
                  href={`/admin/produtos/${produto.id}/editar`}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-3 py-3 text-sm font-semibold"
                >
                  <Pencil size={17} />
                  Editar
                </Link>

                <button
                  onClick={() => excluirProduto(produto.id)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-600"
                >
                  <Trash2 size={17} />
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {produtos.length === 0 && (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="font-semibold">Nenhum produto cadastrado</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}