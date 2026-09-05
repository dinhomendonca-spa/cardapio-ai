"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;

  session: Session | null;

  carregandoAuth: boolean;

  entrar: (
    email: string,
    senha: string
  ) => Promise<void>;

  sair: () => Promise<void>;
};

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(
      null
    );

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

          setSession(
            data.session
          );

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
            setCarregandoAuth(
              false
            );
          }
        }
      };

    carregarSessao();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          novaSessao
        ) => {
          setSession(
            novaSessao
          );

          setUser(
            novaSessao?.user ??
              null
          );

          setCarregandoAuth(
            false
          );
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
          email:
            email
              .trim()
              .toLowerCase(),

          password: senha,
        }
      );

    if (error) {
      throw error;
    }

    setSession(
      data.session
    );

    setUser(
      data.user
    );
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