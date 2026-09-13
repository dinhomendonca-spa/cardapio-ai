"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useCart,
} from "@/context/CartContext";

import {
  Produto,
  useProducts,
} from "@/context/ProductContext";

import {
  useStore,
} from "@/context/StoreContext";

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

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (loja?.nome) {
      document.title =
        loja.nome;
    } else {
      document.title =
        "Lojas AI";
    }

    return () => {
      document.title =
        "Lojas AI";
    };
  }, [
    loja?.nome,
  ]);

  const produtosAtivos =
    produtos.filter(
      (produto) =>
        produto.ativo
    );

  const categorias =
    Array.from(
      new Set(
        produtosAtivos
          .map(
            (produto) =>
              produto.categoria
                ?.trim()
          )
          .filter(Boolean)
      )
    ) as string[];

  const produtosFiltrados =
    produtosAtivos.filter(
      (produto) => {
        const termo =
          busca
            .trim()
            .toLowerCase();

        const correspondeBusca =
          !termo ||
          produto.nome
            .toLowerCase()
            .includes(
              termo
            ) ||
          produto.descricao
            .toLowerCase()
            .includes(
              termo
            ) ||
          produto.categoria
            .toLowerCase()
            .includes(
              termo
            );

        const correspondeCategoria =
          !categoriaSelecionada ||
          produto.categoria ===
            categoriaSelecionada;

        return (
          correspondeBusca &&
          correspondeCategoria
        );
      }
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

  const produtoEsgotado = (
    produto: Produto
  ) => {
    return (
      produto.estoque_controlado &&
      produto.estoque <= 0
    );
  };

  const atingiuLimiteEstoque = (
    produto: Produto
  ) => {
    if (
      !produto.estoque_controlado
    ) {
      return false;
    }

    const quantidade =
      obterQuantidade(
        produto.id
      );

    return (
      quantidade >=
      produto.estoque
    );
  };

  const adicionarAoCarrinho = (
    produto: Produto
  ) => {
    if (
      produtoEsgotado(
        produto
      )
    ) {
      alert(
        "Este produto está esgotado."
      );

      return;
    }

    if (
      atingiuLimiteEstoque(
        produto
      )
    ) {
      alert(
        `Só temos ${produto.estoque} ${
          produto.estoque === 1
            ? "unidade disponível"
            : "unidades disponíveis"
        } deste produto.`
      );

      return;
    }

    adicionarProduto({
      id:
        produto.id,

      nome:
        produto.nome,

      preco:
        produto.preco,

      imagem:
        produto.imagem,
    });
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Carregando loja...
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
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-950">
            Loja não encontrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
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
      : "";

  const lojaDemonstracao =
    loja.slug ===
    "sistemas-inteligentes";

  return (
    <main className="min-h-screen bg-[#f5f6f8] pb-32 text-slate-950">
      {/* BANNER */}
      <section className="relative h-44 w-full overflow-hidden sm:h-56">
        <Image
          src={banner}
          alt={`Banner da ${nomeLoja}`}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/25" />
      </section>

      {/* CARD DA LOJA */}
      <section className="relative mx-auto -mt-10 max-w-md px-4">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)]">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border-4 border-white shadow-md">
              <Image
                src={logo}
                alt={`Logo da ${nomeLoja}`}
                fill
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black">
                    {nomeLoja}
                  </h1>

                  {descricaoLoja && (
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {descricaoLoja}
                    </p>
                  )}
                </div>

                <div
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    lojaDemonstracao
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <BadgeCheck
                    size={14}
                  />

                  {lojaDemonstracao
                    ? "Demonstração"
                    : "Loja online"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {tempoEntrega && (
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 font-semibold text-slate-600">
                    <Clock3
                      size={14}
                    />

                    {tempoEntrega}
                  </span>
                )}

                <span className="rounded-full bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
                  Aberto agora
                </span>
              </div>
            </div>
          </div>

          {localizacao && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
              <MapPin
                size={16}
                className="text-blue-600"
              />

              {localizacao}
            </div>
          )}
        </div>
      </section>      {/* BUSCA E CATEGORIAS */}
      <section className="mx-auto max-w-md px-4 pt-5">
        <div className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100">
          <Search
            size={19}
            className="text-slate-400"
          />

          <input
            type="text"
            value={busca}
            onChange={(event) =>
              setBusca(
                event.target.value
              )
            }
            placeholder="O que você está procurando?"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {categorias.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() =>
                setCategoriaSelecionada(
                  null
                )
              }
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                categoriaSelecionada ===
                null
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-100"
              }`}
            >
              Todos
            </button>

            {categorias.map(
              (
                categoria
              ) => (
                <button
                  type="button"
                  key={categoria}
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoria
                    )
                  }
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    categoriaSelecionada ===
                    categoria
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-100"
                  }`}
                >
                  {categoria}
                </button>
              )
            )}
          </div>
        )}

        {/* PRODUTOS */}
        <div className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-black">
              Produtos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>
          </div>

          {produtosFiltrados.length ===
          0 ? (
            <div className="rounded-[26px] bg-white p-8 text-center shadow-sm">
              <Search
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-bold">
                Nenhum produto encontrado
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Tente outra busca ou categoria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {produtosFiltrados.map(
                (
                  produto
                ) => {
                  const quantidade =
                    obterQuantidade(
                      produto.id
                    );

                  const esgotado =
                    produtoEsgotado(
                      produto
                    );

                  const limiteEstoque =
                    atingiuLimiteEstoque(
                      produto
                    );

                  const estoqueBaixo =
                    produto.estoque_controlado &&
                    produto.estoque >
                      0 &&
                    produto.estoque <=
                      5;

                  return (
                    <article
                      key={
                        produto.id
                      }
                      className={`overflow-hidden rounded-[26px] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] ${
                        esgotado
                          ? "opacity-75"
                          : ""
                      }`}
                    >
                      {/* IMAGEM DO PRODUTO */}
                      <div className="relative h-64 w-full overflow-hidden bg-white">
                        <Image
                          src={
                            produto.imagem
                          }
                          alt={
                            produto.nome
                          }
                          fill
                          sizes="(max-width: 448px) 100vw, 448px"
                          className={`object-contain p-2 ${
                            esgotado
                              ? "grayscale"
                              : ""
                          }`}
                        />

                        {esgotado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-white px-5 py-2 text-sm font-black text-slate-950">
                              ESGOTADO
                            </span>
                          </div>
                        )}
                      </div>

                      {/* INFORMAÇÕES */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-black">
                              {produto.nome}
                            </h3>

                            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                              {produto.categoria}
                            </span>
                          </div>
                        </div>

                        {produto.descricao && (
                          <p className="mt-3 text-sm leading-6 text-slate-500">
                            {produto.descricao}
                          </p>
                        )}

                        {produto.estoque_controlado && (
                          <div className="mt-3">
                            {esgotado ? (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
                                <AlertTriangle
                                  size={14}
                                  className="text-red-500"
                                />

                                <span className="text-xs font-bold text-red-600">
                                  Produto esgotado
                                </span>
                              </div>
                            ) : estoqueBaixo ? (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                                <AlertTriangle
                                  size={14}
                                  className="text-amber-500"
                                />

                                <span className="text-xs font-bold text-amber-700">
                                  Últimas{" "}
                                  {produto.estoque}{" "}
                                  {produto.estoque ===
                                  1
                                    ? "unidade"
                                    : "unidades"}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}                        <div className="mt-5 flex items-center justify-between gap-3">
                          <span className="text-xl font-black">
                            {formatarPreco(
                              produto.preco
                            )}
                          </span>

                          {esgotado ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
                            >
                              Esgotado
                            </button>
                          ) : quantidade ===
                            0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                adicionarAoCarrinho(
                                  produto
                                )
                              }
                              aria-label={`Adicionar ${produto.nome} ao carrinho`}
                              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md transition hover:bg-blue-700 active:scale-95"
                            >
                              <Plus
                                size={20}
                              />
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  removerProduto(
                                    produto.id
                                  )
                                }
                                aria-label={`Remover uma unidade de ${produto.nome}`}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
                              >
                                <Minus
                                  size={17}
                                />
                              </button>

                              <span className="min-w-5 text-center font-black">
                                {quantidade}
                              </span>

                              <button
                                type="button"
                                disabled={
                                  limiteEstoque
                                }
                                onClick={() =>
                                  adicionarAoCarrinho(
                                    produto
                                  )
                                }
                                aria-label={`Adicionar outra unidade de ${produto.nome}`}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  limiteEstoque
                                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                                    : "bg-blue-600 text-white"
                                }`}
                              >
                                <Plus
                                  size={17}
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        {limiteEstoque &&
                          quantidade >
                            0 &&
                          produto.estoque_controlado && (
                            <p className="mt-2 text-right text-xs font-semibold text-amber-600">
                              Limite do estoque atingido
                            </p>
                          )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* CARRINHO */}
      {quantidadeTotal > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
          <Link
            href={`/loja/${loja.slug}/checkout`}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-[22px] bg-slate-950 px-5 py-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <ShoppingCart
                  size={19}
                />

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-black text-white">
                  {quantidadeTotal}
                </span>
              </div>

              <div className="text-left">
                <p className="text-xs text-slate-400">
                  Seu pedido
                </p>

                <p className="font-bold">
                  Ver carrinho
                </p>
              </div>
            </div>

            <span className="font-black">
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