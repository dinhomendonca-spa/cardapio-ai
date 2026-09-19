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

export type TemaLoja =
  | "azul-escuro"
  | "verde-jade"
  | "roxo-magico"
  | "vermelho-rubi"
  | "azul-ceu"
  | "nude"
  | "rosa-claro"
  | "amarelo-claro"
  | "lilas"
  | "verde-claro"
  | "vermelho-claro"
  | "branco"
  | "verde"
  | "vermelho"
  | "preto";

export type Loja = {
  id: number;
  nome: string;
  descricao: string;
  whatsapp: string;
  chave_pix: string;

  aceita_pix: boolean;
  aceita_cartao: boolean;
  mercado_pago_conectado: boolean;

  cidade: string;
  estado: string;
  logo: string;
  banner: string;

  ativo: boolean;
  configuracao_concluida: boolean;
  bloqueada_por_assinatura: boolean;

  taxa_entrega: number;
  taxa_entrega_a_combinar: boolean;
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
  tema_admin: TemaLoja;
  tema_loja: TemaLoja;
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
  recarregarLoja: () => Promise<void>;

  salvarLoja: (
    dados: Partial<
      Omit<
        Loja,
        "id" |
        "bloqueada_por_assinatura"
      >
    >
  ) => Promise<void>;
};

const StoreContext =
  createContext<
    StoreContextType | undefined
  >(undefined);

const CHAVE_LOJA_PUBLICA =
  "lojas_ai_loja_publica";

function converterLoja(
  data: Record<
    string,
    any
  >
): Loja {
  const temasAdminValidos: TemaLoja[] = [
    "azul-escuro",
    "verde-jade",
    "roxo-magico",
    "vermelho-rubi",
  ];

  const temasLojaValidos: TemaLoja[] = [
    "azul-ceu",
    "nude",
    "rosa-claro",
    "amarelo-claro",
    "lilas",
    "verde-claro",
    "vermelho-claro",
  ];

  const normalizarTemaAdmin = (
    valor: unknown
  ): TemaLoja => {
    if (
      temasAdminValidos.includes(
        valor as TemaLoja
      )
    ) {
      return valor as TemaLoja;
    }

    if (valor === "verde") {
      return "verde-jade";
    }

    if (valor === "vermelho") {
      return "vermelho-rubi";
    }

    return "azul-escuro";
  };

  const normalizarTemaLoja = (
    valor: unknown
  ): TemaLoja => {
    if (
      temasLojaValidos.includes(
        valor as TemaLoja
      )
    ) {
      return valor as TemaLoja;
    }

    if (valor === "verde") {
      return "verde-claro";
    }

    if (valor === "vermelho") {
      return "vermelho-claro";
    }

    return "azul-ceu";
  };

  return {
    id:
      Number(
        data.id
      ),

    nome:
      data.nome ??
      "",

    descricao:
      data.descricao ??
      "",

    whatsapp:
      data.whatsapp ??
      "",

    chave_pix:
      data.chave_pix ??
      "",

    aceita_pix:
      data.aceita_pix ??
      true,

    aceita_cartao:
      data.aceita_cartao ??
      false,

    mercado_pago_conectado:
      data.mercado_pago_conectado ??
      false,

    cidade:
      data.cidade ??
      "",

    estado:
      data.estado ??
      "",

    logo:
      data.logo ??
      "",

    banner:
      data.banner ??
      "",

    ativo:
      data.ativo ??
      true,

    configuracao_concluida:
      data.configuracao_concluida ??
      false,

    bloqueada_por_assinatura:
      data.bloqueada_por_assinatura ??
      true,

    taxa_entrega:
      Number(
        data.taxa_entrega ??
        0
      ),

    taxa_entrega_a_combinar:
      data.taxa_entrega_a_combinar ??
      false,

    retirada_permitida:
      data.retirada_permitida ??
      true,

    endereco:
      data.endereco ??
      "",

    numero:
      data.numero ??
      "",

    bairro:
      data.bairro ??
      "",

    cep:
      data.cep ??
      "",

    latitude:
      data.latitude ==
      null
        ? null
        : Number(
            data.latitude
          ),

    longitude:
      data.longitude ==
      null
        ? null
        : Number(
            data.longitude
          ),

    google_maps_url:
      data.google_maps_url ??
      "",

    slug:
      data.slug ??
      "",

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

    tema_admin:
      normalizarTemaAdmin(
        data.tema_admin
      ),

    tema_loja:
      normalizarTemaLoja(
        data.tema_loja
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

  return (
    partes[1] ||
    null
  );
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

  const slugDaUrl =
    extrairSlug(
      pathname
    );

  const [
    loja,
    setLoja,
  ] =
    useState<
      Loja | null
    >(null);

  const [
    perfil,
    setPerfil,
  ] =
    useState<
      Perfil | null
    >(null);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erroLoja,
    setErroLoja,
  ] =
    useState<
      string | null
    >(null);

  const [
    slugPersistido,
    setSlugPersistido,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    try {
      const slug =
        window.localStorage.getItem(
          CHAVE_LOJA_PUBLICA
        );

      if (slug) {
        setSlugPersistido(
          slug
        );
      }
    } catch (error) {
      console.error(
        "Erro ao ler loja persistida:",
        error
      );
    }
  }, []);

  useEffect(() => {
    if (!slugDaUrl) {
      return;
    }

    try {
      window.localStorage.setItem(
        CHAVE_LOJA_PUBLICA,
        slugDaUrl
      );

      setSlugPersistido(
        slugDaUrl
      );
    } catch (error) {
      console.error(
        "Erro ao salvar loja pública:",
        error
      );
    }
  }, [
    slugDaUrl,
  ]);

  const rotaDependeDaLoja =
    pathname ===
      "/pagamento" ||
    pathname.startsWith(
      "/pagamento/"
    );

  const slugPublico =
    slugDaUrl ||
    (
      rotaDependeDaLoja
        ? slugPersistido
        : null
    );

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
            .eq(
              "configuracao_concluida",
              true
            )
            .eq(
              "bloqueada_por_assinatura",
              false
            )
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setLoja(null);

          setErroLoja(
            "Esta loja está temporariamente indisponível."
          );

          return;
        }

        const lojaConvertida =
          converterLoja(
            data
          );

        setLoja(
          lojaConvertida
        );

        setErroLoja(null);

        try {
          window.localStorage.setItem(
            CHAVE_LOJA_PUBLICA,
            lojaConvertida.slug
          );

          setSlugPersistido(
            lojaConvertida.slug
          );
        } catch {
          // O armazenamento local é opcional.
        }
      },
      []
    );

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

        if (perfilError) {
          throw perfilError;
        }

        if (!perfilData) {
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

        if (lojaError) {
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

        setErroLoja(null);
      },
      [
        user,
      ]
    );

  const recarregarLoja =
    useCallback(
      async () => {
        if (
          carregandoAuth
        ) {
          return;
        }

        try {
          setCarregando(true);
          setErroLoja(null);

          if (
            pathname.startsWith(
              "/admin"
            )
          ) {
            await carregarLojaAdmin();

            return;
          }

          if (slugPublico) {
            setPerfil(null);

            await carregarLojaPublica(
              slugPublico
            );

            return;
          }

          if (
            rotaDependeDaLoja
          ) {
            return;
          }

          setLoja(null);
          setPerfil(null);
        } catch (error) {
          console.error(
            "Erro ao carregar loja:",
            error
          );

          setLoja(null);

          setErroLoja(
            "Não foi possível carregar os dados da loja."
          );
        } finally {
          setCarregando(false);
        }
      },
      [
        carregandoAuth,
        pathname,
        slugPublico,
        rotaDependeDaLoja,
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
          "id" |
          "bloqueada_por_assinatura"
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
        data,
        error,
      } =
        await supabase
          .from("lojas")
          .update(dados)
          .eq(
            "id",
            loja.id
          )
          .select("*")
          .single();

      if (error) {
        throw error;
      }

      setLoja(
        converterLoja(data)
      );
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
