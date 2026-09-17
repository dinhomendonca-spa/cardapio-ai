"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Store,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useStore } from "@/context/StoreContext";

export default function HorariosPage() {
  const {
    loja,
    carregando,
    recarregarLoja,
  } = useStore();

  const [usarHorario, setUsarHorario] =
    useState(false);

  const [horarioAbertura, setHorarioAbertura] =
    useState("18:00");

  const [horarioFechamento, setHorarioFechamento] =
    useState("23:59");

  const [
    mensagemForaHorario,
    setMensagemForaHorario,
  ] = useState(
    "No momento estamos fechados. Volte no nosso horário de atendimento."
  );

  const [salvando, setSalvando] =
    useState(false);

  const [salvo, setSalvo] =
    useState(false);

  useEffect(() => {
    if (!loja) {
      return;
    }

    const dados = loja as typeof loja & {
      usar_horario?: boolean;
      horario_abertura?: string;
      horario_fechamento?: string;
      mensagem_fora_horario?: string;
    };

    setUsarHorario(
      dados.usar_horario ?? false
    );

    setHorarioAbertura(
      dados.horario_abertura?.slice(0, 5) ||
        "18:00"
    );

    setHorarioFechamento(
      dados.horario_fechamento?.slice(0, 5) ||
        "23:59"
    );

    setMensagemForaHorario(
      dados.mensagem_fora_horario ||
        "No momento estamos fechados. Volte no nosso horário de atendimento."
    );
  }, [loja]);

  const salvar = async () => {
    if (!loja) {
      alert(
        "Não foi possível identificar a loja."
      );

      return;
    }

    if (
      usarHorario &&
      (!horarioAbertura ||
        !horarioFechamento)
    ) {
      alert(
        "Informe o horário de abertura e fechamento."
      );

      return;
    }

    try {
      setSalvando(true);
      setSalvo(false);

      const { error } = await supabase
        .from("lojas")
        .update({
          usar_horario: usarHorario,

          horario_abertura:
            horarioAbertura,

          horario_fechamento:
            horarioFechamento,

          mensagem_fora_horario:
            mensagemForaHorario.trim(),
        })
        .eq("id", loja.id);

      if (error) {
        throw error;
      }

      await recarregarLoja();

      setSalvo(true);

      setTimeout(() => {
        setSalvo(false);
      }, 3000);
    } catch (error) {
      console.error(
        "Erro ao salvar horário:",
        error
      );

      alert(
        "Não foi possível salvar os horários."
      );
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2
          size={28}
          className="animate-spin text-zinc-500"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 active:scale-95"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <p className="text-[11px] text-zinc-500">
              {loja?.nome || "Sua loja"}
            </p>

            <h1 className="text-lg font-extrabold">
              Horário da loja
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        {/* APRESENTAÇÃO */}
        <section className="rounded-3xl bg-zinc-950 p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Clock3 size={20} />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Funcionamento
              </p>

              <h2 className="mt-1 text-lg font-extrabold">
                Controle automático
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-300">
                Defina quando os clientes poderão acessar a loja e fazer pedidos.
              </p>
            </div>
          </div>
        </section>

        {/* ATIVAR HORÁRIO */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <Store size={18} />
              </div>

              <div>
                <h2 className="text-sm font-extrabold">
                  Usar horário automático
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Fecha a loja fora do horário
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setUsarHorario(
                  (atual) => !atual
                )
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                usarHorario
                  ? "bg-green-600"
                  : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  usarHorario
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>
        </section>

        {/* HORÁRIOS */}
        <section
          className={`rounded-3xl bg-white p-4 shadow-sm ${
            !usarHorario
              ? "opacity-50"
              : ""
          }`}
        >
          <h2 className="font-extrabold">
            Horário de funcionamento
          </h2>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            A loja ficará disponível apenas dentro desse período.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                Abre às
              </label>

              <input
                type="time"
                value={horarioAbertura}
                disabled={!usarHorario}
                onChange={(e) =>
                  setHorarioAbertura(
                    e.target.value
                  )
                }
                className="h-14 w-full rounded-2xl bg-zinc-100 px-4 text-base font-semibold outline-none disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                Fecha às
              </label>

              <input
                type="time"
                value={horarioFechamento}
                disabled={!usarHorario}
                onChange={(e) =>
                  setHorarioFechamento(
                    e.target.value
                  )
                }
                className="h-14 w-full rounded-2xl bg-zinc-100 px-4 text-base font-semibold outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {usarHorario && (
            <div className="mt-3 rounded-2xl bg-green-50 p-3">
              <p className="text-xs font-bold text-green-800">
                Loja aberta diariamente
              </p>

              <p className="mt-1 text-sm text-green-700">
                {horarioAbertura} até{" "}
                {horarioFechamento}
              </p>
            </div>
          )}
        </section>

        {/* MENSAGEM */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="font-extrabold">
            Mensagem quando fechado
          </h2>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Essa mensagem será exibida para o cliente fora do horário.
          </p>

          <textarea
            value={mensagemForaHorario}
            onChange={(e) =>
              setMensagemForaHorario(
                e.target.value
              )
            }
            rows={4}
            maxLength={200}
            placeholder="Mensagem para o cliente"
            className="mt-4 w-full resize-none rounded-2xl bg-zinc-100 px-4 py-3 text-sm leading-6 outline-none"
          />

          <p className="mt-1 text-right text-[10px] text-zinc-400">
            {mensagemForaHorario.length}/200
          </p>
        </section>

        {/* INFORMAÇÃO */}
        <section className="rounded-3xl bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            Horários após a meia-noite
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            Também funciona para estabelecimentos que abrem à noite. Por exemplo: 18:00 até 02:00.
          </p>
        </section>

        {salvo && (
          <section className="flex items-center gap-3 rounded-2xl bg-green-50 p-4">
            <CheckCircle2
              size={20}
              className="text-green-700"
            />

            <div>
              <p className="text-sm font-bold text-green-900">
                Horário salvo
              </p>

              <p className="text-xs text-green-700">
                A loja já seguirá essa configuração.
              </p>
            </div>
          </section>
        )}

        {/* SALVAR */}
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 font-bold text-white shadow-lg disabled:opacity-60"
        >
          {salvando ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Salvando...
            </>
          ) : (
            <>
              <Save size={18} />

              Salvar horário
            </>
          )}
        </button>
      </section>
    </main>
  );
}
