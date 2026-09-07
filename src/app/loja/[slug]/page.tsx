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
   * FILTRO
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

  /*
   * ======================================
   * CARREGANDO
   * ======================================
   */
  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />

          <p className="mt-4 text-sm font-medium text-slate-500">
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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 px-4">

        <div className="w-full max-w-sm rounded-[30px] border border-white/70 bg-white/70 p-7 text-center shadow-[0_20px_60px_rgba(14,165,233,0.12)] backdrop-blur-2xl">

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50/50 to-white pb-32 text-slate-950">

      {/* LUZES DECORATIVAS */}

      <div className="pointer-events-none absolute -left-40 top-56 h-96 w-96 rounded-full bg-sky-300/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-40 top-[650px] h-96 w-96 rounded-full bg-blue-300/15 blur-[120px]" />

      {/* ======================================
          BANNER
      ====================================== */}

      <section className="relative h-48 w-full overflow-hidden sm:h-60">

        <Image
          src={banner}
          alt={`Banner da ${nomeLoja}`}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/55" />

      </section>

      {/* ======================================
          CARD DA LOJA
      ====================================== */}

      <section className="relative z-10 mx-auto -mt-12 max-w-md px-4">

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_70px_rgba(14,165,233,0.16)] backdrop-blur-2xl">

          <div className="flex items-start gap-4">

            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] border-4 border-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">

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

                <div className="flex shrink-0 items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-sm font-bold text-amber-600 backdrop-blur-xl">

                  <Star
                    size={15}
                    fill="currentColor"
                  />

                  4.9

                </div>

              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">

                {tempoEntrega && (
                  <span className="flex items-center gap-1.5 rounded-full border border-sky-200/70 bg-sky-50/80 px-3 py-2 font-semibold text-sky-700 backdrop-blur-xl">

                    <Clock3
                      size={14}
                    />

                    {tempoEntrega}

                  </span>
                )}

                <span className="flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 font-semibold text-emerald-700 backdrop-blur-xl">
                  Aberto agora
                </span>

              </div>

            </div>

          </div>

          {localizacao && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-200/70 pt-4 text-sm text-slate-500">

              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                <MapPin
                  size={16}
                />
              </div>

              {localizacao}

            </div>
          )}

        </div>

      </section>

      {/* ======================================
          BUSCA E CATEGORIAS
      ====================================== */}

      <section className="relative z-10 mx-auto max-w-md px-4 pt-5">

        {/* BUSCA */}

        <div className="flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/70 px-4 py-3.5 shadow-[0_12px_35px_rgba(14,165,233,0.08)] backdrop-blur-2xl transition focus-within:border-sky-300 focus-within:shadow-[0_12px_35px_rgba(14,165,233,0.16)]">

          <Search
            size={19}
            className="text-sky-500"
          />

          <input
            type="text"
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            placeholder="O que você está procurando?"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />

        </div>

        {/* CATEGORIAS */}

        {categorias.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">

            <button
              type="button"
              onClick={() =>
                setCategoriaSelecionada(
                  null
                )
              }
              className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold shadow-sm backdrop-blur-xl transition active:scale-95 ${
                categoriaSelecionada ===
                null
                  ? "border-sky-400 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_24px_rgba(14,165,233,0.25)]"
                  : "border-white/80 bg-white/70 text-slate-600"
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
                  className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold shadow-sm backdrop-blur-xl transition active:scale-95 ${
                    categoriaSelecionada ===
                    categoria
                      ? "border-sky-400 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_24px_rgba(14,165,233,0.25)]"
                      : "border-white/80 bg-white/70 text-slate-600"
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

        <div className="mt-6">

          <div className="mb-4">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
              Catálogo
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Produtos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length ===
              1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

          </div>

          {produtosFiltrados.length ===
          0 ? (
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-8 text-center shadow-[0_15px_45px_rgba(14,165,233,0.08)] backdrop-blur-2xl">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-400">

                <Search
                  size={27}
                />

              </div>

              <p className="mt-4 font-black">
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
                      className={`overflow-hidden rounded-[30px] border border-white/80 bg-white/75 shadow-[0_18px_55px_rgba(14,165,233,0.10)] backdrop-blur-2xl transition ${
                        esgotado
                          ? "opacity-75"
                          : ""
                      }`}
                    >

                      {/* IMAGEM */}

                      <div className="relative h-52 w-full overflow-hidden">

                        <Image
                          src={
                            produto.imagem
                          }
                          alt={
                            produto.nome
                          }
                          fill
                          className={`object-cover transition duration-500 ${
                            esgotado
                              ? "grayscale"
                              : "hover:scale-[1.02]"
                          }`}
                        />

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/35 to-transparent" />

                        {esgotado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">

                            <span className="rounded-full border border-white/30 bg-white/85 px-5 py-2 text-sm font-black text-slate-950 backdrop-blur-xl">
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

                            <span className="mt-2 inline-flex rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-bold text-sky-600">
                              {produto.categoria}
                            </span>

                          </div>

                        </div>

                        {produto.descricao && (
                          <p className="mt-3 text-sm leading-6 text-slate-500">
                            {produto.descricao}
                          </p>
                        )}

                        {/* ESTOQUE */}

                        {produto.estoque_controlado && (
                          <div className="mt-3">

                            {esgotado ? (
                              <div className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">

                                <AlertTriangle
                                  size={14}
                                  className="text-red-500"
                                />

                                <span className="text-xs font-bold text-red-600">
                                  Produto esgotado
                                </span>

                              </div>
                            ) : estoqueBaixo ? (
                              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">

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
                        )}

                        {/* PREÇO E QUANTIDADE */}

                        <div className="mt-5 flex items-center justify-between gap-3">

                          <span className="text-xl font-black text-sky-600">
                            {formatarPreco(
                              produto.preco
                            )}
                          </span>

                          {esgotado ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
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
                              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_10px_30px_rgba(14,165,233,0.30)] transition hover:-translate-y-0.5 active:scale-95"
                            >
                              <Plus
                                size={21}
                              />
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 rounded-[18px] border border-sky-100 bg-sky-50/80 p-1.5 shadow-inner">

                              <button
                                type="button"
                                onClick={() =>
                                  removerProduto(
                                    produto.id
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm transition active:scale-95"
                              >
                                <Minus
                                  size={17}
                                />
                              </button>

                              <span className="min-w-5 text-center font-black text-slate-900">
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
                                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                  limiteEstoque
                                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                                    : "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm active:scale-95"
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

      {/* ======================================
          CARRINHO
      ====================================== */}

      {quantidadeTotal > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">

          <Link
            href={`/loja/${loja.slug}/checkout`}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-[24px] border border-sky-300/30 bg-gradient-to-r from-sky-500/95 to-blue-600/95 px-5 py-4 text-white shadow-[0_18px_50px_rgba(14,165,233,0.35)] backdrop-blur-2xl transition active:scale-[0.99]"
          >

            <div className="flex items-center gap-3">

              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">

                <ShoppingCart
                  size={20}
                />

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-black text-sky-600 shadow-sm">
                  {quantidadeTotal}
                </span>

              </div>

              <div className="text-left">

                <p className="text-[11px] font-medium text-sky-100">
                  Seu pedido
                </p>

                <p className="font-black">
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