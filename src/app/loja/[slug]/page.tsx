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
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useStore } from "@/context/StoreContext";

export default function LojaPublicaPage() {
  const {
    itens,
    adicionarProduto,
    removerProduto,
    quantidadeTotal,
    valorTotal,
  } = useCart();

  const {
    produtos,
  } = useProducts();

  const {
    loja,
    carregando,
    erroLoja,
  } = useStore();

  const produtosAtivos =
    produtos.filter(
      (produto) =>
        produto.ativo
    );

  const categorias =
    Array.from(
      new Set(
        produtosAtivos.map(
          (produto) =>
            produto.categoria
        )
      )
    );

  const formatarPreco = (
    valor: number
  ) =>
    valor.toLocaleString(
      "pt-BR",
      {
        style:
          "currency",
        currency:
          "BRL",
      }
    );

  const obterQuantidade = (
    id: number
  ) => {
    return (
      itens.find(
        (item) =>
          item.id === id
      )?.quantidade || 0
    );
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-950" />

          <p className="mt-3 text-sm text-zinc-500">
            Carregando cardápio...
          </p>
        </div>
      </main>
    );
  }

  if (
    erroLoja ||
    !loja
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-extrabold">
            Loja não encontrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {erroLoja ||
              "Essa loja não está disponível."}
          </p>
        </div>
      </main>
    );
  }

  const nomeLoja =
    loja.nome ||
    "Sua loja";

  const descricaoLoja =
    loja.descricao ||
    "";

  const localizacao =
    loja.cidade &&
    loja.estado
      ? `${loja.cidade} - ${loja.estado}`
      : loja.cidade ||
        loja.estado ||
        "";

  const banner =
    loja.banner ||
    "/images/banner.png";

  const logo =
    loja.logo ||
    "/images/logo.png";

  const tempoEntrega =
    loja.tempo_entrega_min &&
    loja.tempo_entrega_max
      ? `${loja.tempo_entrega_min}-${loja.tempo_entrega_max} min`
      : "35-50 min";

  return (
    <main className="min-h-screen bg-zinc-100 pb-32 text-zinc-950">
      <section className="relative h-44 w-full overflow-hidden sm:h-56">
        <Image
          src={banner}
          alt={`Banner da ${nomeLoja}`}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/25" />
      </section>

      <section className="relative mx-auto -mt-10 max-w-md px-4">
        <div className="rounded-3xl bg-white p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-md">
              <Image
                src={logo}
                alt={`Logo da ${nomeLoja}`}
                fill
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">
                    {nomeLoja}
                  </h1>

                  {descricaoLoja && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {
                        descricaoLoja
                      }
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-600">
                  <Star
                    size={15}
                    fill="currentColor"
                  />

                  4.9
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
                <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-2">
                  <Clock3
                    size={14}
                  />

                  {
                    tempoEntrega
                  }
                </span>

                <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-2 font-medium text-green-700">
                  Aberto agora
                </span>
              </div>
            </div>
          </div>

          {localizacao && (
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
              <MapPin
                size={16}
              />

              {
                localizacao
              }
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-md px-4 pt-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Search
            size={19}
            className="text-zinc-400"
          />

          <input
            type="text"
            placeholder="O que você está com vontade de comer?"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        {categorias.length >
          0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {categorias.map(
              (
                categoria,
                index
              ) => (
                <button
                  key={
                    categoria
                  }
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    index ===
                    0
                      ? "bg-zinc-950 text-white"
                      : "bg-white text-zinc-700 shadow-sm"
                  }`}
                >
                  {
                    categoria
                  }
                </button>
              )
            )}
          </div>
        )}

        <div className="mt-5">
          <div className="mb-4">
            <p className="text-sm text-zinc-500">
              Cardápio
            </p>

            <h2 className="text-2xl font-bold">
              Produtos
            </h2>
          </div>

          {produtosAtivos.length ===
          0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="font-semibold">
                Nenhum produto disponível.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {produtosAtivos.map(
                (
                  produto
                ) => {
                  const quantidade =
                    obterQuantidade(
                      produto.id
                    );

                  return (
                    <article
                      key={
                        produto.id
                      }
                      className="overflow-hidden rounded-3xl bg-white shadow-sm"
                    >
                      <div className="relative h-48 w-full">
                        <Image
                          src={
                            produto.imagem
                          }
                          alt={
                            produto.nome
                          }
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-bold">
                            {
                              produto.nome
                            }
                          </h3>

                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                            {
                              produto.categoria
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          {
                            produto.descricao
                          }
                        </p>

                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {formatarPreco(
                              produto.preco
                            )}
                          </span>

                          {quantidade ===
                          0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                adicionarProduto(
                                  {
                                    id:
                                      produto.id,

                                    nome:
                                      produto.nome,

                                    preco:
                                      produto.preco,

                                    imagem:
                                      produto.imagem,
                                  }
                                )
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white active:scale-95"
                            >
                              <Plus
                                size={
                                  20
                                }
                              />
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  removerProduto(
                                    produto.id
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
                              >
                                <Minus
                                  size={
                                    17
                                  }
                                />
                              </button>

                              <span className="min-w-5 text-center font-bold">
                                {
                                  quantidade
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  adicionarProduto(
                                    {
                                      id:
                                        produto.id,

                                      nome:
                                        produto.nome,

                                      preco:
                                        produto.preco,

                                      imagem:
                                        produto.imagem,
                                    }
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white"
                              >
                                <Plus
                                  size={
                                    17
                                  }
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {quantidadeTotal >
        0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
          <Link
            href={`/loja/${loja.slug}/checkout`}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-white shadow-2xl active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <ShoppingCart
                  size={
                    19
                  }
                />

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-zinc-950">
                  {
                    quantidadeTotal
                  }
                </span>
              </div>

              <div className="text-left">
                <p className="text-xs text-zinc-400">
                  Seu pedido
                </p>

                <p className="font-semibold">
                  Ver carrinho
                </p>
              </div>
            </div>

            <span className="font-bold">
              {formatarPreco(
                valorTotal
              )}
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}