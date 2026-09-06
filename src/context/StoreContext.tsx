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
  usePathname,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  supabase,
} from "@/lib/supabase";

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

  slug: string;

  dono_id?: string | null;

  aberto_manual?: boolean;
  usar_horario?: boolean;

  horario_abertura?: string | null;
  horario_fechamento?: string | null;

  mensagem_fora_horario?: string | null;

  pedido_minimo?: number;

  entrega_ativa?: boolean;

  tempo_entrega_min?: number;
  tempo_entrega_max?: number;
};

export type Perfil = {
  id: string;

  nome: string;

  loja_id: number | null;

  papel:
    | "proprietario"
    | "gerente"
    | "atendente";

  ativo: boolean;
};

type StoreContextType = {
  loja: Loja | null;

  perfil: Perfil | null;

  carregando: boolean;

  erroLoja: string | null;

  slugPublico: string | null;

  recarregarLoja:
    () => Promise<void>;

  salvarLoja: (
    dados: Partial<
      Omit<Loja, "id">
    >
  ) => Promise<void>;
};

const StoreContext =
  createContext<
    StoreContextType | undefined
  >(undefined);

function converterLoja(
  data: Record<string, any>
): Loja {
  return {
    id:
      Number(data.id),

    nome:
      data.nome ?? "",

    descricao:
      data.descricao ?? "",

    whatsapp:
      data.whatsapp ?? "",

    chave_pix:
      data.chave_pix ?? "",

    cidade:
      data.cidade ?? "",

    estado:
      data.estado ?? "",

    logo:
      data.logo ?? "",

    banner:
      data.banner ?? "",

    ativo:
      data.ativo ?? true,

    taxa_entrega:
      Number(
        data.taxa_entrega ??
          0
      ),

    retirada_permitida:
      data.retirada_permitida ??
      true,

    endereco:
      data.endereco ?? "",

    numero:
      data.numero ?? "",

    bairro:
      data.bairro ?? "",

    cep:
      data.cep ?? "",

    latitude:
      data.latitude == null
        ? null
        : Number(
            data.latitude
          ),

    longitude:
      data.longitude == null
        ? null
        : Number(
            data.longitude
          ),

    google_maps_url:
      data.google_maps_url ??
      "",

    slug:
      data.slug ?? "",

    dono_id:
      data.dono_id ??
      null,

    aberto_manual:
      data.aberto_manual ??
      true,

    usar_horario:
      data.usar_horario ??
      false,

    horario_abertura:
      data.horario_abertura ??
      null,

    horario_fechamento:
      data.horario_fechamento ??
      null,

    mensagem_fora_horario:
      data.mensagem_fora_horario ??
      "",

    pedido_minimo:
      Number(
        data.pedido_minimo ??
          0
      ),

    entrega_ativa:
      data.entrega_ativa ??
      true,

    tempo_entrega_min:
      Number(
        data.tempo_entrega_min ??
          35
      ),

    tempo_entrega_max:
      Number(
        data.tempo_entrega_max ??
          50
      ),
  };
}

function extrairSlug(
  pathname: string
) {
  const partes =
    pathname
      .split("/")
      .filter(Boolean);

  if (
    partes[0] !==
    "loja"
  ) {
    return null;
  }

  return partes[1] || null;
}

export function StoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const {
    user,
    carregandoAuth,
  } = useAuth();

  const slugPublico =
    extrairSlug(
      pathname
    );

  const [
    loja,
    setLoja,
  ] =
    useState<Loja | null>(
      null
    );

  const [
    perfil,
    setPerfil,
  ] =
    useState<Perfil | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erroLoja,
    setErroLoja,
  ] =
    useState<string | null>(
      null
    );

  /*
   * ======================================
   * LOJA PÚBLICA PELO SLUG
   * ======================================
   */
  const carregarLojaPublica =
    useCallback(
      async (
        slug: string
      ) => {
        const {
          data,
          error,
        } =
          await supabase
            .from("lojas")
            .select("*")
            .eq(
              "slug",
              slug
            )
            .eq(
              "ativo",
              true
            )
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setLoja(null);

          setErroLoja(
            "Loja não encontrada ou indisponível."
          );

          return;
        }

        setLoja(
          converterLoja(
            data
          )
        );

        setErroLoja(
          null
        );
      },
      []
    );

  /*
   * ======================================
   * LOJA DO USUÁRIO DO ADMIN
   * ======================================
   */
  const carregarLojaAdmin =
    useCallback(
      async () => {
        if (!user) {
          setPerfil(null);
          setLoja(null);

          return;
        }

        const {
          data:
            perfilData,

          error:
            perfilError,
        } =
          await supabase
            .from("perfis")
            .select(
              "id,nome,loja_id,papel,ativo"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          perfilError
        ) {
          throw perfilError;
        }

        if (
          !perfilData
        ) {
          setPerfil(null);
          setLoja(null);

          setErroLoja(
            "Usuário sem perfil."
          );

          return;
        }

        const perfilAtual: Perfil =
          {
            id:
              perfilData.id,

            nome:
              perfilData.nome ??
              "",

            loja_id:
              perfilData.loja_id ==
              null
                ? null
                : Number(
                    perfilData.loja_id
                  ),

            papel:
              perfilData.papel ??
              "proprietario",

            ativo:
              perfilData.ativo ??
              true,
          };

        setPerfil(
          perfilAtual
        );

        if (
          !perfilAtual.ativo
        ) {
          setLoja(null);

          setErroLoja(
            "Usuário desativado."
          );

          return;
        }

        if (
          !perfilAtual.loja_id
        ) {
          setLoja(null);

          setErroLoja(
            "Usuário sem loja vinculada."
          );

          return;
        }

        const {
          data:
            lojaData,

          error:
            lojaError,
        } =
          await supabase
            .from("lojas")
            .select("*")
            .eq(
              "id",
              perfilAtual.loja_id
            )
            .maybeSingle();

        if (
          lojaError
        ) {
          throw lojaError;
        }

        if (!lojaData) {
          setLoja(null);

          setErroLoja(
            "Loja não encontrada."
          );

          return;
        }

        setLoja(
          converterLoja(
            lojaData
          )
        );

        setErroLoja(
          null
        );
      },
      [
        user,
      ]
    );

  /*
   * ======================================
   * DECIDE QUAL LOJA CARREGAR
   * ======================================
   */
  const recarregarLoja =
    useCallback(
      async () => {
        if (
          carregandoAuth
        ) {
          return;
        }

        try {
          setCarregando(
            true
          );

          setErroLoja(
            null
          );

          /*
           * ROTA PÚBLICA
           *
           * /loja/lanchuria/...
           *
           * Sempre respeita o slug,
           * mesmo se houver usuário
           * logado no navegador.
           */
          if (
            slugPublico
          ) {
            setPerfil(
              null
            );

            await carregarLojaPublica(
              slugPublico
            );

            return;
          }

          /*
           * ADMIN
           */
          if (
            pathname.startsWith(
              "/admin"
            )
          ) {
            await carregarLojaAdmin();

            return;
          }

          /*
           * Outras páginas não precisam
           * carregar uma loja.
           */
          setLoja(null);
          setPerfil(null);
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar loja:",
            error
          );

          setLoja(null);

          setErroLoja(
            "Não foi possível carregar os dados da loja."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        carregandoAuth,
        slugPublico,
        pathname,
        carregarLojaPublica,
        carregarLojaAdmin,
      ]
    );

  useEffect(() => {
    recarregarLoja();
  }, [
    recarregarLoja,
  ]);

  const salvarLoja =
    async (
      dados: Partial<
        Omit<
          Loja,
          "id"
        >
      >
    ) => {
      if (!user) {
        throw new Error(
          "Usuário não autenticado."
        );
      }

      if (!loja) {
        throw new Error(
          "Nenhuma loja vinculada."
        );
      }

      const {
        error,
      } =
        await supabase
          .from("lojas")
          .update(
            dados
          )
          .eq(
            "id",
            loja.id
          );

      if (error) {
        throw error;
      }

      await recarregarLoja();
    };

  return (
    <StoreContext.Provider
      value={{
        loja,
        perfil,
        carregando,
        erroLoja,
        slugPublico,
        recarregarLoja,
        salvarLoja,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context =
    useContext(
      StoreContext
    );

  if (!context) {
    throw new Error(
      "useStore deve ser usado dentro de StoreProvider"
    );
  }

  return context;
}