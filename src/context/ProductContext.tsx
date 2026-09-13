"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useStore,
} from "@/context/StoreContext";

import {
  supabase,
} from "@/lib/supabase";

export type AjusteImagem =
  | "conter"
  | "preencher";

export type Produto = {
  id: number;
  loja_id: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  estoque: number;
  estoque_controlado: boolean;
  imagem: string;
  ajuste_imagem: AjusteImagem;
  ativo: boolean;
};

type NovoProduto = Omit<
  Produto,
  "id" | "loja_id"
>;

type ProductContextType = {
  produtos: Produto[];
  carregando: boolean;

  adicionarProduto: (
    produto: NovoProduto
  ) => Promise<void>;

  excluirProduto: (
    id: number
  ) => Promise<void>;

  alternarStatus: (
    id: number
  ) => Promise<void>;

  recarregarProdutos:
    () => Promise<void>;
};

const ProductContext =
  createContext<
    ProductContextType | undefined
  >(undefined);

function normalizarAjusteImagem(
  valor: unknown
): AjusteImagem {
  return valor === "preencher"
    ? "preencher"
    : "conter";
}

export function ProductProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    loja,
    carregando: carregandoLoja,
  } = useStore();

  const [
    produtos,
    setProdutos,
  ] = useState<Produto[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const recarregarProdutos =
    useCallback(
      async () => {
        if (carregandoLoja) {
          return;
        }

        if (!loja) {
          setProdutos([]);
          setCarregando(false);

          return;
        }

        try {
          setCarregando(true);

          const {
            data,
            error,
          } = await supabase
            .from("produtos")
            .select("*")
            .eq(
              "loja_id",
              loja.id
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

          if (error) {
            throw error;
          }

          setProdutos(
            (data ?? []).map(
              (
                produto
              ): Produto => ({
                id:
                  Number(
                    produto.id
                  ),

                loja_id:
                  Number(
                    produto.loja_id
                  ),

                nome:
                  produto.nome ??
                  "",

                descricao:
                  produto.descricao ??
                  "",

                categoria:
                  produto.categoria ??
                  "",

                preco:
                  Number(
                    produto.preco ??
                    0
                  ),

                estoque:
                  Number(
                    produto.estoque ??
                    0
                  ),

                estoque_controlado:
                  produto.estoque_controlado ??
                  true,

                imagem:
                  produto.imagem ??
                  "/images/logo.png",

                ajuste_imagem:
                  normalizarAjusteImagem(
                    produto.ajuste_imagem
                  ),

                ativo:
                  produto.ativo ??
                  true,
              })
            )
          );
        } catch (error) {
          console.error(
            "Erro ao carregar produtos:",
            error
          );

          setProdutos([]);
        } finally {
          setCarregando(false);
        }
      },
      [
        loja,
        carregandoLoja,
      ]
    );

  useEffect(() => {
    recarregarProdutos();
  }, [
    recarregarProdutos,
  ]);

  const adicionarProduto =
    async (
      produto: NovoProduto
    ) => {
      if (!loja) {
        throw new Error(
          "Nenhuma loja carregada."
        );
      }

      const {
        error,
      } = await supabase
        .from("produtos")
        .insert({
          loja_id:
            loja.id,

          nome:
            produto.nome,

          descricao:
            produto.descricao,

          categoria:
            produto.categoria,

          preco:
            produto.preco,

          estoque:
            produto.estoque,

          estoque_controlado:
            produto.estoque_controlado,

          imagem:
            produto.imagem,

          ajuste_imagem:
            normalizarAjusteImagem(
              produto.ajuste_imagem
            ),

          ativo:
            produto.ativo,
        });

      if (error) {
        console.error(
          "Erro ao cadastrar produto:",
          error
        );

        throw error;
      }

      await recarregarProdutos();
    };

  const excluirProduto =
    async (
      id: number
    ) => {
      if (!loja) {
        throw new Error(
          "Nenhuma loja carregada."
        );
      }

      const {
        error,
      } = await supabase
        .from("produtos")
        .delete()
        .eq(
          "id",
          id
        )
        .eq(
          "loja_id",
          loja.id
        );

      if (error) {
        console.error(
          "Erro ao excluir produto:",
          error
        );

        throw error;
      }

      await recarregarProdutos();
    };

  const alternarStatus =
    async (
      id: number
    ) => {
      if (!loja) {
        throw new Error(
          "Nenhuma loja carregada."
        );
      }

      const produto =
        produtos.find(
          (
            item
          ) =>
            item.id === id
        );

      if (!produto) {
        return;
      }

      const {
        error,
      } = await supabase
        .from("produtos")
        .update({
          ativo:
            !produto.ativo,
        })
        .eq(
          "id",
          id
        )
        .eq(
          "loja_id",
          loja.id
        );

      if (error) {
        console.error(
          "Erro ao atualizar produto:",
          error
        );

        throw error;
      }

      await recarregarProdutos();
    };

  return (
    <ProductContext.Provider
      value={{
        produtos,
        carregando,
        adicionarProduto,
        excluirProduto,
        alternarStatus,
        recarregarProdutos,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context =
    useContext(
      ProductContext
    );

  if (!context) {
    throw new Error(
      "useProducts deve ser usado dentro de ProductProvider"
    );
  }

  return context;
}