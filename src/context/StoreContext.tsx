"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export type Loja = {
  id: number;
  nome: string;
  descricao: string;
  whatsapp: string;
  chave_pix: string;
  cidade: string;
  estado: string;
  logo: string;
  banner: string;
  ativo: boolean;

  taxa_entrega: number;
  retirada_permitida: boolean;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
};

type StoreContextType = {
  loja: Loja | null;
  carregando: boolean;
  recarregarLoja: () => Promise<void>;
  salvarLoja: (dados: Omit<Loja, "id">) => Promise<void>;
};

const StoreContext = createContext<StoreContextType | undefined>(
  undefined
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregarLoja = async () => {
    setCarregando(true);

    const { data, error } = await supabase
      .from("lojas")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar loja:", error);
      setCarregando(false);
      return;
    }

    if (!data) {
      setLoja(null);
      setCarregando(false);
      return;
    }

    setLoja({
      id: data.id,
      nome: data.nome ?? "",
      descricao: data.descricao ?? "",
      whatsapp: data.whatsapp ?? "",
      chave_pix: data.chave_pix ?? "",
      cidade: data.cidade ?? "",
      estado: data.estado ?? "",
      logo: data.logo ?? "",
      banner: data.banner ?? "",
      ativo: data.ativo ?? true,

      taxa_entrega: Number(data.taxa_entrega ?? 0),
      retirada_permitida: data.retirada_permitida ?? true,
      endereco: data.endereco ?? "",
      numero: data.numero ?? "",
      bairro: data.bairro ?? "",
      cep: data.cep ?? "",
      latitude:
        data.latitude === null || data.latitude === undefined
          ? null
          : Number(data.latitude),
      longitude:
        data.longitude === null || data.longitude === undefined
          ? null
          : Number(data.longitude),
      google_maps_url: data.google_maps_url ?? "",
    });

    setCarregando(false);
  };

  useEffect(() => {
    recarregarLoja();
  }, []);

  const salvarLoja = async (dados: Omit<Loja, "id">) => {
    if (loja) {
      const { error } = await supabase
        .from("lojas")
        .update(dados)
        .eq("id", loja.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("lojas")
        .insert(dados);

      if (error) throw error;
    }

    await recarregarLoja();
  };

  return (
    <StoreContext.Provider
      value={{
        loja,
        carregando,
        recarregarLoja,
        salvarLoja,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore deve ser usado dentro de StoreProvider");
  }

  return context;
}