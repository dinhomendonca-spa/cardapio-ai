"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type ProdutoCarrinho = {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
};

export type ItemCarrinho = ProdutoCarrinho & {
  quantidade: number;
};

export type DadosCheckout = {
  clienteNome: string;
  clienteTelefone: string;

  tipoEntrega: "entrega" | "retirada";

  rua: string;
  numero: string;
  bairro: string;
  complemento: string;

  taxaEntrega: number;
};

type CartContextType = {
  itens: ItemCarrinho[];

  adicionarProduto: (
    produto: ProdutoCarrinho
  ) => void;

  removerProduto: (
    id: number
  ) => void;

  limparCarrinho: () => void;

  quantidadeTotal: number;

  valorTotal: number;

  dadosCheckout: DadosCheckout;

  salvarDadosCheckout: (
    dados: DadosCheckout
  ) => void;
};

const CartContext = createContext<
  CartContextType | undefined
>(undefined);

const checkoutInicial: DadosCheckout = {
  clienteNome: "",
  clienteTelefone: "",

  tipoEntrega: "entrega",

  rua: "",
  numero: "",
  bairro: "",
  complemento: "",

  taxaEntrega: 0,
};

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [itens, setItens] = useState<
    ItemCarrinho[]
  >([]);

  const [
    dadosCheckout,
    setDadosCheckout,
  ] = useState<DadosCheckout>(
    checkoutInicial
  );

  const adicionarProduto = (
    produto: ProdutoCarrinho
  ) => {
    setItens((atual) => {
      const existente = atual.find(
        (item) =>
          item.id === produto.id
      );

      if (existente) {
        return atual.map(
          (item) =>
            item.id === produto.id
              ? {
                  ...item,
                  quantidade:
                    item.quantidade + 1,
                }
              : item
        );
      }

      return [
        ...atual,
        {
          ...produto,
          quantidade: 1,
        },
      ];
    });
  };

  const removerProduto = (
    id: number
  ) => {
    setItens((atual) =>
      atual
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantidade:
                  item.quantidade - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantidade > 0
        )
    );
  };

  const limparCarrinho = () => {
    setItens([]);
    setDadosCheckout(
      checkoutInicial
    );
  };

  const salvarDadosCheckout = (
    dados: DadosCheckout
  ) => {
    setDadosCheckout(dados);
  };

  const quantidadeTotal =
    useMemo(() => {
      return itens.reduce(
        (total, item) =>
          total +
          item.quantidade,
        0
      );
    }, [itens]);

  const valorTotal =
    useMemo(() => {
      return itens.reduce(
        (total, item) =>
          total +
          item.preco *
            item.quantidade,
        0
      );
    }, [itens]);

  return (
    <CartContext.Provider
      value={{
        itens,
        adicionarProduto,
        removerProduto,
        limparCarrinho,
        quantidadeTotal,
        valorTotal,
        dadosCheckout,
        salvarDadosCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart deve ser usado dentro de CartProvider"
    );
  }

  return context;
}