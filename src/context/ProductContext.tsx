"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

export type Produto = {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  imagem: string;
  ativo: boolean;
};

type NovoProduto = Omit<Produto, "id">;

type ProductContextType = {
  produtos: Produto[];
  carregando: boolean;
  adicionarProduto: (produto: NovoProduto) => Promise<void>;
  excluirProduto: (id: number) => Promise<void>;
  alternarStatus: (id: number) => Promise<void>;
  recarregarProdutos: () => Promise<void>;
};

const ProductContext = createContext<ProductContextType | undefined>(
  undefined
);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregarProdutos = async () => {
    setCarregando(true);

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      setCarregando(false);
      return;
    }

    setProdutos(
      (data ?? []).map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao ?? "",
        categoria: produto.categoria,
        preco: Number(produto.preco),
        imagem: produto.imagem ?? "/images/pizza.png",
        ativo: produto.ativo ?? true,
      }))
    );

    setCarregando(false);
  };

  useEffect(() => {
    recarregarProdutos();
  }, []);

  const adicionarProduto = async (produto: NovoProduto) => {
    const { error } = await supabase.from("produtos").insert({
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      preco: produto.preco,
      imagem: produto.imagem,
      ativo: produto.ativo,
    });

    if (error) {
      console.error("Erro ao cadastrar produto:", error);
      throw error;
    }

    await recarregarProdutos();
  };

  const excluirProduto = async (id: number) => {
    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir produto:", error);
      throw error;
    }

    await recarregarProdutos();
  };

  const alternarStatus = async (id: number) => {
    const produto = produtos.find((item) => item.id === id);

    if (!produto) return;

    const { error } = await supabase
      .from("produtos")
      .update({
        ativo: !produto.ativo,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar produto:", error);
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
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts deve ser usado dentro de ProductProvider"
    );
  }

  return context;
}