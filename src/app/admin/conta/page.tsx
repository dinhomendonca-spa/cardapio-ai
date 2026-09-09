"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import {
  FormEvent,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Aviso = {
  tipo: "sucesso" | "erro";
  texto: string;
} | null;

function mensagemDeErro(
  error: unknown,
) {
  const mensagem =
    error instanceof Error
      ? error.message.toLowerCase()
      : "";

  if (
    mensagem.includes(
      "current password",
    ) ||
    mensagem.includes(
      "invalid login credentials",
    )
  ) {
    return "A senha atual está incorreta.";
  }

  if (
    mensagem.includes(
      "already registered",
    ) ||
    mensagem.includes(
      "already been registered",
    )
  ) {
    return "Este e-mail já está sendo utilizado.";
  }

  if (
    mensagem.includes(
      "password should be",
    ) ||
    mensagem.includes(
      "weak password",
    )
  ) {
    return "Escolha uma senha mais forte.";
  }

  if (
    mensagem.includes(
      "rate limit",
    ) ||
    mensagem.includes("429")
  ) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }

  return "Não foi possível concluir a alteração. Tente novamente.";
}

export default function ContaPage() {
  const { user } = useAuth();

  const [novoEmail, setNovoEmail] =
    useState(user?.email ?? "");

  const [senhaEmail, setSenhaEmail] =
    useState("");

  const [salvandoEmail, setSalvandoEmail] =
    useState(false);

  const [avisoEmail, setAvisoEmail] =
    useState<Aviso>(null);

  const [senhaAtual, setSenhaAtual] =
    useState("");

  const [novaSenha, setNovaSenha] =
    useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [mostrarSenhas, setMostrarSenhas] =
    useState(false);

  const [salvandoSenha, setSalvandoSenha] =
    useState(false);

  const [avisoSenha, setAvisoSenha] =
    useState<Aviso>(null);

  const alterarEmail = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const emailNormalizado = novoEmail
      .trim()
      .toLowerCase();

    setAvisoEmail(null);

    if (!emailNormalizado) {
      setAvisoEmail({
        tipo: "erro",
        texto: "Informe o novo e-mail.",
      });

      return;
    }

    if (
      emailNormalizado ===
      user?.email?.toLowerCase()
    ) {
      setAvisoEmail({
        tipo: "erro",
        texto: "Digite um e-mail diferente do atual.",
      });

      return;
    }

    if (!senhaEmail) {
      setAvisoEmail({
        tipo: "erro",
        texto: "Informe sua senha atual para confirmar.",
      });

      return;
    }

    try {
      setSalvandoEmail(true);

      const { data, error } =
        await supabase.auth.updateUser({
          email: emailNormalizado,
          current_password: senhaEmail,
        });

      if (error) {
        throw error;
      }

      setSenhaEmail("");

      const alteradoImediatamente =
        data.user.email?.toLowerCase() ===
        emailNormalizado;

      setAvisoEmail({
        tipo: "sucesso",
        texto: alteradoImediatamente
          ? "E-mail alterado com sucesso."
          : "Enviamos uma confirmação para o novo e-mail. O endereço atual continuará válido até a confirmação.",
      });
    } catch (error) {
      console.error(
        "Erro ao alterar e-mail:",
        error,
      );

      setAvisoEmail({
        tipo: "erro",
        texto: mensagemDeErro(error),
      });
    } finally {
      setSalvandoEmail(false);
    }
  };

  const alterarSenha = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setAvisoSenha(null);

    if (!senhaAtual) {
      setAvisoSenha({
        tipo: "erro",
        texto: "Informe sua senha atual.",
      });

      return;
    }

    if (novaSenha.length < 8) {
      setAvisoSenha({
        tipo: "erro",
        texto: "A nova senha precisa ter pelo menos 8 caracteres.",
      });

      return;
    }

    if (novaSenha !== confirmarSenha) {
      setAvisoSenha({
        tipo: "erro",
        texto: "A confirmação não corresponde à nova senha.",
      });

      return;
    }

    if (novaSenha === senhaAtual) {
      setAvisoSenha({
        tipo: "erro",
        texto: "A nova senha precisa ser diferente da atual.",
      });

      return;
    }

    try {
      setSalvandoSenha(true);

      const { error } =
        await supabase.auth.updateUser({
          password: novaSenha,
          current_password: senhaAtual,
        });

      if (error) {
        throw error;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      setAvisoSenha({
        tipo: "sucesso",
        texto: "Senha alterada com sucesso.",
      });
    } catch (error) {
      console.error(
        "Erro ao alterar senha:",
        error,
      );

      setAvisoSenha({
        tipo: "erro",
        texto: mensagemDeErro(error),
      });
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020b18] px-4 pb-16 pt-6 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center gap-3">
          <Link
            href="/admin"
            aria-label="Voltar ao painel"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/15 bg-white/[0.06] text-sky-200"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
              Segurança
            </p>

            <h1 className="mt-0.5 text-2xl font-black">
              Minha conta
            </h1>
          </div>
        </header>

        <section className="mt-6 rounded-[28px] border border-sky-300/15 bg-white/[0.06] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
              <UserRoundCog size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">
                E-mail de acesso atual
              </p>

              <p className="truncate font-bold text-white">
                {user?.email || "E-mail não disponível"}
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={alterarEmail}
          className="mt-4 rounded-[28px] bg-white p-5 text-zinc-950 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Mail size={20} />
            </div>

            <div>
              <h2 className="font-extrabold">
                Alterar e-mail
              </h2>

              <p className="text-xs text-zinc-500">
                Este será seu novo e-mail de acesso.
              </p>
            </div>
          </div>

          <label
            htmlFor="novo-email"
            className="mb-1.5 mt-5 block text-xs font-bold text-zinc-700"
          >
            Novo e-mail
          </label>

          <input
            id="novo-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={novoEmail}
            onChange={(event) =>
              setNovoEmail(event.target.value)
            }
            className="h-13 w-full rounded-2xl bg-zinc-100 px-4 text-base outline-none focus:ring-2 focus:ring-sky-300"
          />

          <label
            htmlFor="senha-email"
            className="mb-1.5 mt-3 block text-xs font-bold text-zinc-700"
          >
            Senha atual
          </label>

          <input
            id="senha-email"
            type="password"
            autoComplete="current-password"
            value={senhaEmail}
            onChange={(event) =>
              setSenhaEmail(event.target.value)
            }
            placeholder="Confirme sua identidade"
            className="h-13 w-full rounded-2xl bg-zinc-100 px-4 text-base outline-none focus:ring-2 focus:ring-sky-300"
          />

          {avisoEmail && (
            <div
              role="status"
              className={`mt-3 rounded-2xl p-3 text-xs font-medium leading-5 ${
                avisoEmail.tipo === "sucesso"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {avisoEmail.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={salvandoEmail}
            className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 font-bold text-white disabled:opacity-60"
          >
            {salvandoEmail ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <CheckCircle2 size={18} />
            )}

            {salvandoEmail
              ? "Salvando..."
              : "Salvar novo e-mail"}
          </button>
        </form>

        <form
          onSubmit={alterarSenha}
          className="mt-4 rounded-[28px] bg-white p-5 text-zinc-950 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <KeyRound size={20} />
            </div>

            <div>
              <h2 className="font-extrabold">
                Alterar senha
              </h2>

              <p className="text-xs text-zinc-500">
                Use pelo menos 8 caracteres.
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <label
              htmlFor="senha-atual"
              className="mb-1.5 block text-xs font-bold text-zinc-700"
            >
              Senha atual
            </label>

            <input
              id="senha-atual"
              type={mostrarSenhas ? "text" : "password"}
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(event) =>
                setSenhaAtual(event.target.value)
              }
              className="h-13 w-full rounded-2xl bg-zinc-100 px-4 pr-12 text-base outline-none focus:ring-2 focus:ring-violet-300"
            />

            <button
              type="button"
              onClick={() =>
                setMostrarSenhas((atual) => !atual)
              }
              aria-label={
                mostrarSenhas
                  ? "Ocultar senhas"
                  : "Mostrar senhas"
              }
              className="absolute bottom-1.5 right-1.5 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500"
            >
              {mostrarSenhas ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <label
            htmlFor="nova-senha"
            className="mb-1.5 mt-3 block text-xs font-bold text-zinc-700"
          >
            Nova senha
          </label>

          <input
            id="nova-senha"
            type={mostrarSenhas ? "text" : "password"}
            autoComplete="new-password"
            value={novaSenha}
            onChange={(event) =>
              setNovaSenha(event.target.value)
            }
            className="h-13 w-full rounded-2xl bg-zinc-100 px-4 text-base outline-none focus:ring-2 focus:ring-violet-300"
          />

          <label
            htmlFor="confirmar-senha"
            className="mb-1.5 mt-3 block text-xs font-bold text-zinc-700"
          >
            Confirmar nova senha
          </label>

          <input
            id="confirmar-senha"
            type={mostrarSenhas ? "text" : "password"}
            autoComplete="new-password"
            value={confirmarSenha}
            onChange={(event) =>
              setConfirmarSenha(event.target.value)
            }
            className="h-13 w-full rounded-2xl bg-zinc-100 px-4 text-base outline-none focus:ring-2 focus:ring-violet-300"
          />

          {avisoSenha && (
            <div
              role="status"
              className={`mt-3 rounded-2xl p-3 text-xs font-medium leading-5 ${
                avisoSenha.tipo === "sucesso"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {avisoSenha.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={salvandoSenha}
            className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 font-bold text-white disabled:opacity-60"
          >
            {salvandoSenha ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <ShieldCheck size={18} />
            )}

            {salvandoSenha
              ? "Salvando..."
              : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </main>
  );
}