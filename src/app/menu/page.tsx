"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Store,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useStore } from "@/context/StoreContext";

export default function MenuPage() {
  const {
    itens,
    adicionarProduto,
    removerProduto,
    quantidadeTotal,
    valorTotal,
  } = useCart();

  const { produtos } = useProducts();
  const { loja, carregando } = useStore();

  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Todos");

  const produtosAtivos = produtos.filter((produto) => produto.ativo);

  const categorias = [
    "Todos",
    ...Array.from(
      new Set(produtosAtivos.map((produto) => produto.categoria))
    ),
  ];

  const produtosFiltrados = useMemo(() => {
    return produtosAtivos.filter((produto) => {
      const correspondeCategoria =
        categoriaSelecionada === "Todos" ||
        produto.categoria === categoriaSelecionada;

      const termo = busca.trim().toLowerCase();

      const correspondeBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.descricao?.toLowerCase().includes(termo);

      return correspondeCategoria && correspondeBusca;
    });
  }, [produtosAtivos, busca, categoriaSelecionada]);

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const obterQuantidade = (id: number) =>
    itens.find((item) => item.id === id)?.quantidade || 0;

  const nomeLoja = carregando
    ? "Carregando..."
    : loja?.nome || "Sua loja";

  const descricaoLoja = loja?.descricao || "";

  const localizacao =
    loja?.cidade && loja?.estado
      ? `${loja.cidade} - ${loja.estado}`
      : loja?.cidade || loja?.estado || "";

  const banner = loja?.banner || "/images/banner.png";
  const logo = loja?.logo || "/images/logo.png";

  return (
    <main className="min-h-screen bg-white pb-32 text-zinc-950">
      {/* BANNER */}
      <section className="bg-zinc-100">
        <div className="relative mx-auto aspect-[16/8] w-full max-w-2xl overflow-hidden bg-zinc-200">
          <Image
            src={banner}
            alt={`Banner da ${nomeLoja}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
        </div>
      </section>

      {/* LOJA */}
      <section className="mx-auto max-w-md px-4">
        <div className="relative pb-4">
          <div className="relative z-10 -mt-7 h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
            <Image
              src={logo}
              alt={`Logo da ${nomeLoja}`}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>

          <div className="mt-3">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
              {nomeLoja}
            </h1>

            {descricaoLoja && (
              <p className="mt-1 text-sm leading-5 text-zinc-500">
                {descricaoLoja}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <Star size={14} fill="currentColor" />
              4.9
            </span>

            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
              <Clock3 size={14} />
              35-50 min
            </span>

            <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
              Aberto
            </span>
          </div>

          {localizacao && (
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
              <MapPin size={16} className="shrink-0" />
              <span>{localizacao}</span>
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-zinc-100" />

      {/* BUSCA */}
      <section className="mx-auto max-w-md px-4 pt-4">
        <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-zinc-100 px-4">
          <Search size={20} className="shrink-0 text-zinc-400" />

          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="O que você está com vontade?"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* CATEGORIAS */}
        <div className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 pb-1">
            {categorias.map((categoria) => {
              const selecionada =
                categoriaSelecionada === categoria;

              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() =>
                    setCategoriaSelecionada(categoria)
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                    selecionada
                      ? "bg-zinc-950 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  {categoria}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section className="mx-auto max-w-md px-4 pt-5">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Cardápio
          </p>

          <h2 className="mt-1 text-xl font-extrabold">
            {categoriaSelecionada === "Todos"
              ? "Todos os produtos"
              : categoriaSelecionada}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Escolha o que mais combina com você
          </p>
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 px-6 py-10 text-center">
            <Store size={30} className="mx-auto text-zinc-300" />

            <p className="mt-3 font-semibold">
              Nenhum produto encontrado
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Tente buscar por outro nome ou categoria.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {produtosFiltrados.map((produto) => {
              const quantidade = obterQuantidade(produto.id);

              return (
                <article
                  key={produto.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)_88px] items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-2.5 shadow-sm"
                >
                  {/* CONTROLE À ESQUERDA */}
                  <div className="flex items-center justify-center">
                    {quantidade === 0 ? (
                      <button
                        type="button"
                        aria-label={`Adicionar ${produto.nome}`}
                        onClick={() =>
                          adicionarProduto({
                            id: produto.id,
                            nome: produto.nome,
                            preco: produto.preco,
                            imagem: produto.imagem,
                          })
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm active:scale-90"
                      >
                        <Plus size={20} />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center rounded-xl bg-zinc-100 p-1">
                        <button
                          type="button"
                          aria-label={`Adicionar ${produto.nome}`}
                          onClick={() =>
                            adicionarProduto({
                              id: produto.id,
                              nome: produto.nome,
                              preco: produto.preco,
                              imagem: produto.imagem,
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white active:scale-90"
                        >
                          <Plus size={15} />
                        </button>

                        <span className="py-1 text-xs font-bold">
                          {quantidade}
                        </span>

                        <button
                          type="button"
                          aria-label={`Remover ${produto.nome}`}
                          onClick={() =>
                            removerProduto(produto.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm active:scale-90"
                        >
                          <Minus size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TEXTO */}
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold leading-[18px]">
                      {produto.nome}
                    </h3>

                    {produto.descricao && (
                      <p className="mt-1 text-[11px] leading-[15px] text-zinc-500">
                        {produto.descricao}
                      </p>
                    )}

                    <p className="mt-2 text-[15px] font-extrabold">
                      {formatarPreco(produto.preco)}
                    </p>
                  </div>

                  {/* FOTO */}
                  <div className="relative h-[88px] w-[88px] overflow-hidden rounded-xl bg-zinc-100">
                    <Image
                      src={produto.imagem}
                      alt={produto.nome}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTÃO REALIZAR PEDIDO */}
      {quantidadeTotal > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white/95 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.10)] backdrop-blur">
          <Link
            href="/checkout"
            className="mx-auto flex h-16 w-full max-w-md items-center justify-between rounded-2xl bg-zinc-950 px-5 text-white shadow-xl active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <ShoppingCart size={20} />

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-zinc-950">
                  {quantidadeTotal}
                </span>
              </div>

              <div>
                <p className="text-[11px] text-zinc-400">
                  {quantidadeTotal}{" "}
                  {quantidadeTotal === 1 ? "item" : "itens"}
                </p>

                <p className="text-[15px] font-bold">
                  Realizar pedido
                </p>
              </div>
            </div>

            <span className="text-[16px] font-extrabold">
              {formatarPreco(valorTotal)}
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}