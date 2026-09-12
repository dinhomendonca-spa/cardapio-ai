"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type DadosCadastro = {
  nome: string;
  cpf: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  email: string;
  senha: string;
};

export type PlanoCadastro =
  | "mensal"
  | "anual";

type ResultadoCadastro = {
  precisaConfirmarEmail: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  carregandoAuth: boolean;

  entrar: (
    email: string,
    senha: string
  ) => Promise<void>;

  cadastrar: (
    dados: DadosCadastro,
    plano?: PlanoCadastro
  ) => Promise<ResultadoCadastro>;

  reenviarConfirmacao: (
    email: string,
    plano?: PlanoCadastro
  ) => Promise<void>;

  sair: () => Promise<void>;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function montarUrlConfirmacao(
  plano: PlanoCadastro
) {
  const parametros =
    new URLSearchParams({
      confirmado: "1",
      plano,
    });

  return `${
    window.location.origin
  }/login?${parametros.toString()}`;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [
    carregandoAuth,
    setCarregandoAuth,
  ] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregarSessao =
      async () => {
        try {
          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          if (!ativo) {
            return;
          }

          setSession(data.session);
          setUser(
            data.session?.user ??
              null
          );
        } catch (error) {
          console.error(
            "Erro ao carregar sessão:",
            error
          );

          if (ativo) {
            setSession(null);
            setUser(null);
          }
        } finally {
          if (ativo) {
            setCarregandoAuth(false);
          }
        }
      };

    carregarSessao();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, novaSessao) => {
          setSession(novaSessao);

          setUser(
            novaSessao?.user ??
              null
          );

          setCarregandoAuth(false);
        }
      );

    return () => {
      ativo = false;

      listener.subscription.unsubscribe();
    };
  }, []);

  const entrar = async (
    email: string,
    senha: string
  ) => {
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email: email
            .trim()
            .toLowerCase(),

          password: senha,
        }
      );

    if (error) {
      throw error;
    }

    setSession(data.session);
    setUser(data.user);
  };

  const cadastrar = async (
    dados: DadosCadastro,
    plano: PlanoCadastro = "mensal"
  ): Promise<ResultadoCadastro> => {
    const email = dados.email
      .trim()
      .toLowerCase();

    const cpf =
      somenteNumeros(dados.cpf);

    const telefone =
      somenteNumeros(
        dados.telefone
      );

    const cep =
      somenteNumeros(dados.cep);

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email,

        password: dados.senha,

        options: {
          emailRedirectTo:
            montarUrlConfirmacao(
              plano
            ),

          data: {
            nome:
              dados.nome.trim(),

            cpf,

            telefone,

            cep,

            endereco:
              dados.endereco.trim(),

            numero:
              dados.numero.trim(),

            complemento:
              dados.complemento.trim(),

            bairro:
              dados.bairro.trim(),

            cidade:
              dados.cidade.trim(),

            estado:
              dados.estado
                .trim()
                .toUpperCase(),

            plano,
          },
        },
      });

    if (error) {
      throw error;
    }

    setSession(data.session);
    setUser(data.user);

    return {
      precisaConfirmarEmail:
        data.session === null,
    };
  };

  const reenviarConfirmacao =
    async (
      email: string,
      plano: PlanoCadastro = "mensal"
    ) => {
      const emailNormalizado =
        email
          .trim()
          .toLowerCase();

      if (
        !emailNormalizado ||
        !emailNormalizado.includes(
          "@"
        )
      ) {
        throw new Error(
          "Digite um e-mail válido."
        );
      }

      const { error } =
        await supabase.auth.resend({
          type: "signup",

          email: emailNormalizado,

          options: {
            emailRedirectTo:
              montarUrlConfirmacao(
                plano
              ),
          },
        });

      if (error) {
        throw error;
      }
    };

  const sair = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        carregandoAuth,
        entrar,
        cadastrar,
        reenviarConfirmacao,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser usado dentro de AuthProvider"
    );
  }

  return context;
}