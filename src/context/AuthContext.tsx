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
    dados: DadosCadastro
  ) => Promise<ResultadoCadastro>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
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

    const carregarSessao = async () => {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!ativo) {
          return;
        }

        setSession(data.session);
        setUser(
          data.session?.user ?? null
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
    } = supabase.auth.onAuthStateChange(
      (_event, novaSessao) => {
        setSession(novaSessao);
        setUser(
          novaSessao?.user ?? null
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
      await supabase.auth.signInWithPassword({
        email: email
          .trim()
          .toLowerCase(),
        password: senha,
      });

    if (error) {
      throw error;
    }

    setSession(data.session);
    setUser(data.user);
  };

  const cadastrar = async (
    dados: DadosCadastro
  ): Promise<ResultadoCadastro> => {
    const email = dados.email
      .trim()
      .toLowerCase();

    const cpf =
      somenteNumeros(dados.cpf);

    const telefone =
      somenteNumeros(dados.telefone);

    const cep =
      somenteNumeros(dados.cep);

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password: dados.senha,
      options: {
        emailRedirectTo:
          `${window.location.origin}/login?confirmado=1`,
        data: {
          nome: dados.nome.trim(),
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

  const sair = async () => {
    const {
      error,
    } = await supabase.auth.signOut();

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