"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AlertTriangle,
  Clock3,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
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

  /*
   * ======================================
   * NOME DA LOJA NA ABA DO NAVEGADOR
   * ======================================
   */
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

  /*
   * ======================================
   * PRODUTOS ATIVOS
   * ======================================
   */
  const produtosAtivos =
    produtos.filter(
      (produto) =>
        produto.ativo
    );

  /*
   * ======================================
   * CATEGORIAS
   * ======================================
   */
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

  /*
   * ======================================
   * FILTRO DE BUSCA E CATEGORIA
   * ======================================
   */
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

  /*
   * ======================================
   * QUANTIDADE DO PRODUTO NO CARRINHO
   * ======================================
   */
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

  /*
   * ======================================
   * VERIFICA SE PRODUTO ESTÁ ESGOTADO
   * ======================================
   */
  const produtoEsgotado = (
    produto: Produto
  ) => {
    return (
      produto.estoque_controlado &&
      produto.estoque <= 0
    );
  };

  /*
   * ======================================
   * VERIFICA LIMITE DO ESTOQUE
   * ======================================
   */
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

  /*
   * ======================================
   * ADICIONAR PRODUTO COM VALIDAÇÃO
   * ======================================
   */
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

  /*
   * ======================================
   * CARREGANDO
   * ======================================
   */
  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-950" />

          <p className="mt-3 text-sm text-zinc-500">
            Carregando loja...
          </p>

        </div>

      </main>
    );
  }

  /*
   * ======================================
   * LOJA NÃO ENCONTRADA
   * ======================================
   */
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
      : "";

  return (
    <main className="min-h-screen bg-zinc-100 pb-32 text-zinc-950">

      {/* ======================================
          BANNER
      ====================================== */}
      <section className="relative h-44 w-full overflow-hidden sm:h-56">

        <Image
          src={
            banner
          }
          alt={`Banner da ${nomeLoja}`}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/25" />

      </section>

      {/* ======================================
          DADOS DA LOJA
      ====================================== */}
      <section className="relative mx-auto -mt-10 max-w-md px-4">

        <div className="rounded-3xl bg-white p-5 shadow-lg">

          <div className="flex items-start gap-4">

            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-md">

              <Image
                src={
                  logo
                }
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
                      {descricaoLoja}
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

                {tempoEntrega && (
                  <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-2">

                    <Clock3
                      size={14}
                    />

                    {tempoEntrega}

                  </span>
                )}

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

              {localizacao}

            </div>
          )}

        </div>

      </section>

      {/* ======================================
          BUSCA
      ====================================== */}
      <section className="mx-auto max-w-md px-4 pt-5">

        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">

          <Search
            size={19}
            className="text-zinc-400"
          />

          <input
            type="text"
            value={
              busca
            }
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            placeholder="O que você está procurando?"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />

        </div>

        {/* ======================================
            CATEGORIAS
        ====================================== */}
        {categorias.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">

            <button
              type="button"
              onClick={() =>
                setCategoriaSelecionada(
                  null
                )
              }
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                categoriaSelecionada ===
                null
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-700 shadow-sm"
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
                  key={
                    categoria
                  }
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoria
                    )
                  }
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    categoriaSelecionada ===
                    categoria
                      ? "bg-zinc-950 text-white"
                      : "bg-white text-zinc-700 shadow-sm"
                  }`}
                >
                  {categoria}
                </button>
              )
            )}

          </div>
        )}

        {/* ======================================
            PRODUTOS
        ====================================== */}
        <div className="mt-5">

          <div className="mb-4">

            <h2 className="text-2xl font-bold">
              Produtos
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length ===
              1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

          </div>

          {produtosFiltrados.length ===
          0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

              <Search
                size={30}
                className="mx-auto text-zinc-300"
              />

              <p className="mt-3 font-semibold">
                Nenhum produto encontrado
              </p>

              <p className="mt-1 text-sm text-zinc-500">
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
                      className={`overflow-hidden rounded-3xl bg-white shadow-sm ${
                        esgotado
                          ? "opacity-75"
                          : ""
                      }`}
                    >

                      {/* IMAGEM */}
                      <div className="relative h-48 w-full">

                        <Image
                          src={
                            produto.imagem
                          }
                          alt={
                            produto.nome
                          }
                          fill
                          className={`object-cover ${
                            esgotado
                              ? "grayscale"
                              : ""
                          }`}
                        />

                        {esgotado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">

                            <span className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-zinc-950">
                              ESGOTADO
                            </span>

                          </div>
                        )}

                      </div>

                      {/* INFORMAÇÕES */}
                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0 flex-1">

                            <h3 className="text-lg font-bold">
                              {produto.nome}
                            </h3>

                            <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                              {produto.categoria}
                            </span>

                          </div>

                        </div>

                        {produto.descricao && (
                          <p className="mt-3 text-sm leading-6 text-zinc-500">
                            {produto.descricao}
                          </p>
                        )}

                        {/* ESTOQUE */}
                        {produto.estoque_controlado && (
                          <div className="mt-3">

                            {esgotado ? (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">

                                <AlertTriangle
                                  size={14}
                                  className="text-red-600"
                                />

                                <span className="text-xs font-bold text-red-600">
                                  Produto esgotado
                                </span>

                              </div>
                            ) : estoqueBaixo ? (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">

                                <AlertTriangle
                                  size={14}
                                  className="text-amber-600"
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
                        )}

                        {/* PREÇO E QUANTIDADE */}
                        <div className="mt-5 flex items-center justify-between">

                          <span className="text-lg font-bold">
                            {formatarPreco(
                              produto.preco
                            )}
                          </span>

                          {esgotado ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-2xl bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500"
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
                              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white active:scale-95"
                            >
                              <Plus
                                size={20}
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
                                  size={17}
                                />
                              </button>

                              <span className="min-w-5 text-center font-bold">
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
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  limiteEstoque
                                    ? "cursor-not-allowed bg-zinc-300 text-zinc-500"
                                    : "bg-zinc-950 text-white"
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
                            <p className="mt-2 text-right text-xs font-medium text-amber-700">
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

      {/* ======================================
          CARRINHO
      ====================================== */}
      {quantidadeTotal > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">

          <Link
            href={`/loja/${loja.slug}/checkout`}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-white shadow-2xl active:scale-[0.99]"
          >

            <div className="flex items-center gap-3">

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">

                <ShoppingCart
                  size={19}
                />

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-zinc-950">
                  {quantidadeTotal}
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