"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import Link from "next/link";

import {
  useProducts,
} from "@/context/ProductContext";

export default function ProdutosPage() {
  const {
    produtos,
    excluirProduto,
    alternarStatus,
  } = useProducts();

  const formatarPreco = (
    valor: number
  ) =>
    valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );

  const excluir = async (
    id: number,
    nome: string
  ) => {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${nome}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      await excluirProduto(
        id
      );
    } catch (error) {
      console.error(
        "Erro ao excluir produto:",
        error
      );

      alert(
        "Não foi possível excluir o produto."
      );
    }
  };

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#020b18]
        pb-28
        text-white
      "
    >
      {/* FUNDO DECORATIVO */}

      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-96
          w-96
          rounded-full
          bg-sky-500/20
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-40
          top-64
          h-96
          w-96
          rounded-full
          bg-blue-600/15
          blur-[120px]
        "
      />

      {/* HEADER */}

      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-sky-300/10
          bg-[#020b18]/80
          backdrop-blur-2xl
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-md
            items-center
            gap-4
            px-4
            py-4
          "
        >
          <Link
            href="/admin"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              border
              border-sky-300/15
              bg-white/[0.06]
              text-sky-200
              shadow-[0_10px_30px_rgba(0,0,0,0.25)]
              backdrop-blur-xl
              transition
              hover:border-sky-300/30
              hover:bg-sky-400/10
              active:scale-95
            "
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-sky-300
              "
            >
              Painel do comerciante
            </p>

            <h1
              className="
                mt-1
                text-xl
                font-black
                text-white
              "
            >
              Produtos
            </h1>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}

      <section
        className="
          relative
          z-10
          mx-auto
          max-w-md
          px-4
          py-5
        "
      >
        {/* TOPO */}

        <div
          className="
            mb-5
            flex
            items-center
            justify-between
            rounded-[28px]
            border
            border-sky-300/15
            bg-white/[0.06]
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.28)]
            backdrop-blur-2xl
          "
        >
          <div>
            <p className="text-sm text-slate-400">
              Sua loja
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-black
                text-white
              "
            >
              {produtos.length}{" "}
              {produtos.length === 1
                ? "produto"
                : "produtos"}
            </h2>
          </div>

          <Link
            href="/admin/produtos/novo"
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-sky-300/25
              bg-gradient-to-br
              from-sky-400
              to-blue-600
              text-white
              shadow-[0_10px_30px_rgba(14,165,233,0.35)]
              transition
              hover:-translate-y-0.5
              active:scale-95
            "
          >
            <Plus
              size={22}
            />
          </Link>
        </div>

        {/* PAINEL DE PRODUTOS */}

        <div
          className="
            rounded-[32px]
            border
            border-sky-300/15
            bg-white/[0.04]
            p-3
            shadow-[0_25px_80px_rgba(0,0,0,0.30)]
            backdrop-blur-2xl
          "
        >
          <div className="space-y-3">

            {produtos.map(
              (produto) => {
                const esgotado =
                  produto.estoque_controlado &&
                  produto.estoque === 0;

                const estoqueBaixo =
                  produto.estoque_controlado &&
                  produto.estoque > 0 &&
                  produto.estoque <= 5;

                return (
                  <article
                    key={
                      produto.id
                    }
                    className="
                      rounded-[26px]
                      border
                      border-white/[0.07]
                      bg-gradient-to-br
                      from-white/[0.08]
                      to-white/[0.03]
                      p-4
                      shadow-[0_14px_40px_rgba(0,0,0,0.20)]
                      backdrop-blur-xl
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        {/* NOME E STATUS */}

                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >
                          <h3
                            className="
                              text-base
                              font-black
                              text-white
                            "
                          >
                            {produto.nome}
                          </h3>

                          <span
                            className={`
                              rounded-full
                              border
                              px-2.5
                              py-1
                              text-[11px]
                              font-bold
                              ${
                                produto.ativo
                                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                                  : "border-slate-300/10 bg-white/[0.04] text-slate-400"
                              }
                            `}
                          >
                            {produto.ativo
                              ? "Ativo"
                              : "Oculto"}
                          </span>

                          {esgotado && (
                            <span
                              className="
                                rounded-full
                                border
                                border-red-300/20
                                bg-red-500/10
                                px-2.5
                                py-1
                                text-[11px]
                                font-bold
                                text-red-300
                              "
                            >
                              Esgotado
                            </span>
                          )}
                        </div>

                        {/* CATEGORIA */}

                        <p
                          className="
                            mt-1
                            text-sm
                            text-slate-400
                          "
                        >
                          {produto.categoria}
                        </p>

                        {/* PREÇO */}

                        <p
                          className="
                            mt-3
                            text-xl
                            font-black
                            text-sky-300
                          "
                        >
                          {formatarPreco(
                            produto.preco
                          )}
                        </p>

                        {/* ESTOQUE */}

                        <div className="mt-3">
                          {!produto.estoque_controlado ? (
                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-white/[0.07]
                                bg-white/[0.05]
                                px-3
                                py-2
                                backdrop-blur-xl
                              "
                            >
                              <Boxes
                                size={15}
                                className="text-slate-400"
                              />

                              <span
                                className="
                                  text-xs
                                  font-semibold
                                  text-slate-300
                                "
                              >
                                Estoque não controlado
                              </span>
                            </div>
                          ) : esgotado ? (
                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-red-300/15
                                bg-red-500/10
                                px-3
                                py-2
                                backdrop-blur-xl
                              "
                            >
                              <AlertTriangle
                                size={15}
                                className="text-red-300"
                              />

                              <span
                                className="
                                  text-xs
                                  font-bold
                                  text-red-300
                                "
                              >
                                Sem estoque
                              </span>
                            </div>
                          ) : estoqueBaixo ? (
                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-amber-300/15
                                bg-amber-400/10
                                px-3
                                py-2
                                backdrop-blur-xl
                              "
                            >
                              <AlertTriangle
                                size={15}
                                className="text-amber-300"
                              />

                              <span
                                className="
                                  text-xs
                                  font-bold
                                  text-amber-300
                                "
                              >
                                Estoque baixo:{" "}
                                {produto.estoque}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-sky-300/15
                                bg-sky-400/10
                                px-3
                                py-2
                                backdrop-blur-xl
                              "
                            >
                              <Boxes
                                size={15}
                                className="text-sky-300"
                              />

                              <span
                                className="
                                  text-xs
                                  font-bold
                                  text-sky-300
                                "
                              >
                                Estoque:{" "}
                                {produto.estoque}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AÇÕES */}

                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-3
                        gap-2
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          alternarStatus(
                            produto.id
                          )
                        }
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-2xl
                          border
                          border-sky-300/10
                          bg-white/[0.05]
                          px-3
                          py-3
                          text-xs
                          font-bold
                          text-slate-200
                          shadow-[0_8px_25px_rgba(0,0,0,0.15)]
                          backdrop-blur-xl
                          transition
                          hover:border-sky-300/25
                          hover:bg-sky-400/10
                          active:scale-[0.98]
                        "
                      >
                        {produto.ativo ? (
                          <EyeOff
                            size={16}
                          />
                        ) : (
                          <Eye
                            size={16}
                          />
                        )}

                        {produto.ativo
                          ? "Ocultar"
                          : "Ativar"}
                      </button>

                      <Link
                        href={`/admin/produtos/${produto.id}/editar`}
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-2xl
                          border
                          border-sky-300/15
                          bg-sky-400/10
                          px-3
                          py-3
                          text-xs
                          font-bold
                          text-sky-200
                          shadow-[0_8px_25px_rgba(14,165,233,0.10)]
                          backdrop-blur-xl
                          transition
                          hover:border-sky-300/30
                          hover:bg-sky-400/15
                          active:scale-[0.98]
                        "
                      >
                        <Pencil
                          size={16}
                        />

                        Editar
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          excluir(
                            produto.id,
                            produto.nome
                          )
                        }
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-2xl
                          border
                          border-red-300/15
                          bg-red-500/10
                          px-3
                          py-3
                          text-xs
                          font-bold
                          text-red-300
                          shadow-[0_8px_25px_rgba(239,68,68,0.08)]
                          backdrop-blur-xl
                          transition
                          hover:border-red-300/30
                          hover:bg-red-500/15
                          active:scale-[0.98]
                        "
                      >
                        <Trash2
                          size={16}
                        />

                        Excluir
                      </button>
                    </div>
                  </article>
                );
              }
            )}

            {/* VAZIO */}

            {produtos.length === 0 && (
              <div
                className="
                  rounded-[26px]
                  border
                  border-sky-300/10
                  bg-white/[0.05]
                  p-8
                  text-center
                  shadow-[0_15px_45px_rgba(0,0,0,0.18)]
                  backdrop-blur-xl
                "
              >
                <Boxes
                  size={36}
                  className="
                    mx-auto
                    text-sky-300/50
                  "
                />

                <p
                  className="
                    mt-4
                    font-bold
                    text-white
                  "
                >
                  Nenhum produto cadastrado
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >
                  Cadastre o primeiro produto da sua loja.
                </p>

                <Link
                  href="/admin/produtos/novo"
                  className="
                    mt-5
                    flex
                    min-h-12
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-sky-300/25
                    bg-gradient-to-r
                    from-sky-500/30
                    to-blue-600/30
                    px-4
                    font-bold
                    text-white
                    shadow-[0_12px_35px_rgba(14,165,233,0.18)]
                    backdrop-blur-xl
                    transition
                    hover:-translate-y-0.5
                    active:scale-[0.98]
                  "
                >
                  <Plus
                    size={18}
                  />

                  Novo produto
                </Link>
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}