"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
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

  slug?: string;

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

  recarregarLoja: () => Promise<void>;

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
  lojaData: Record<string, any>
): Loja {
  return {
    id: Number(
      lojaData.id
    ),

    nome:
      lojaData.nome ??
      "",

    descricao:
      lojaData.descricao ??
      "",

    whatsapp:
      lojaData.whatsapp ??
      "",

    chave_pix:
      lojaData.chave_pix ??
      "",

    cidade:
      lojaData.cidade ??
      "",

    estado:
      lojaData.estado ??
      "",

    logo:
      lojaData.logo ??
      "",

    banner:
      lojaData.banner ??
      "",

    ativo:
      lojaData.ativo ??
      true,

    taxa_entrega:
      Number(
        lojaData.taxa_entrega ??
          0
      ),

    retirada_permitida:
      lojaData.retirada_permitida ??
      true,

    endereco:
      lojaData.endereco ??
      "",

    numero:
      lojaData.numero ??
      "",

    bairro:
      lojaData.bairro ??
      "",

    cep:
      lojaData.cep ??
      "",

    latitude:
      lojaData.latitude ===
        null ||
      lojaData.latitude ===
        undefined
        ? null
        : Number(
            lojaData.latitude
          ),

    longitude:
      lojaData.longitude ===
        null ||
      lojaData.longitude ===
        undefined
        ? null
        : Number(
            lojaData.longitude
          ),

    google_maps_url:
      lojaData.google_maps_url ??
      "",

    slug:
      lojaData.slug ??
      "",

    dono_id:
      lojaData.dono_id ??
      null,

    aberto_manual:
      lojaData.aberto_manual ??
      true,

    usar_horario:
      lojaData.usar_horario ??
      false,

    horario_abertura:
      lojaData.horario_abertura ??
      null,

    horario_fechamento:
      lojaData.horario_fechamento ??
      null,

    mensagem_fora_horario:
      lojaData.mensagem_fora_horario ??
      "",

    pedido_minimo:
      Number(
        lojaData.pedido_minimo ??
          0
      ),

    entrega_ativa:
      lojaData.entrega_ativa ??
      true,

    tempo_entrega_min:
      Number(
        lojaData.tempo_entrega_min ??
          35
      ),

    tempo_entrega_max:
      Number(
        lojaData.tempo_entrega_max ??
          50
      ),
  };
}

export function StoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    carregandoAuth,
  } = useAuth();

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
   * ==========================================================
   * LOJA PÚBLICA
   *
   * Usada pelo cliente que acessa:
   *
   * /menu
   * /checkout
   * /pagamento
   *
   * O cliente NÃO precisa fazer login.
   * ==========================================================
   */
  const carregarLojaPublica =
    useCallback(
      async () => {
        try {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "lojas"
              )
              .select("*")
              .eq(
                "ativo",
                true
              )
              .order(
                "id",
                {
                  ascending:
                    true,
                }
              )
              .limit(1)
              .maybeSingle();

          if (error) {
            throw error;
          }

          if (!data) {
            setLoja(
              null
            );

            setErroLoja(
              "Nenhuma loja disponível."
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
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar loja pública:",
            error
          );

          setLoja(null);

          setErroLoja(
            "Não foi possível carregar a loja."
          );
        }
      },
      []
    );

  /*
   * ==========================================================
   * LOJA DO COMERCIANTE
   *
   * Usuário autenticado:
   *
   * auth user
   *    ↓
   * perfil
   *    ↓
   * loja_id
   *    ↓
   * loja
   * ==========================================================
   */
  const carregarLojaUsuario =
    useCallback(
      async () => {
        if (!user) {
          return;
        }

        const {
          data:
            perfilData,

          error:
            perfilError,
        } =
          await supabase
            .from(
              "perfis"
            )
            .select(`
              id,
              nome,
              loja_id,
              papel,
              ativo
            `)
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
          setPerfil(
            null
          );

          setLoja(
            null
          );

          setErroLoja(
            "Seu usuário ainda não possui um perfil."
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
              perfilData.loja_id ===
                null ||
              perfilData.loja_id ===
                undefined
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
          setLoja(
            null
          );

          setErroLoja(
            "Este usuário está desativado."
          );

          return;
        }

        if (
          !perfilAtual.loja_id
        ) {
          setLoja(
            null
          );

          setErroLoja(
            "Seu usuário ainda não está vinculado a uma loja."
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
            .from(
              "lojas"
            )
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

        if (
          !lojaData
        ) {
          setLoja(
            null
          );

          setErroLoja(
            "A loja vinculada ao usuário não foi encontrada."
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
   * ==========================================================
   * CARREGAMENTO PRINCIPAL
   * ==========================================================
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
           * Se existe login:
           * carrega loja do comerciante.
           */
          if (user) {
            await carregarLojaUsuario();

            return;
          }

          /*
           * Se NÃO existe login:
           * cliente acessando cardápio público.
           */
          setPerfil(
            null
          );

          await carregarLojaPublica();
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar loja:",
            error
          );

          setLoja(
            null
          );

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
        user,
        carregarLojaPublica,
        carregarLojaUsuario,
      ]
    );

  useEffect(() => {
    recarregarLoja();
  }, [
    recarregarLoja,
  ]);

  /*
   * ==========================================================
   * SALVAR LOJA
   *
   * Somente comerciante autenticado.
   * ==========================================================
   */
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
          "Nenhuma loja vinculada ao usuário."
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            "lojas"
          )
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