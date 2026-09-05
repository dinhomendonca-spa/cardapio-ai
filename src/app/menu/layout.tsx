"use client";

import {
  Clock3,
  Loader2,
  Store,
} from "lucide-react";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type LojaHorario = {
  id: number;
  nome: string;

  usar_horario: boolean;

  horario_abertura:
    | string
    | null;

  horario_fechamento:
    | string
    | null;

  mensagem_fora_horario:
    | string
    | null;
};

function minutosDoHorario(
  horario: string
) {
  const [hora, minuto] =
    horario
      .slice(0, 5)
      .split(":")
      .map(Number);

  return hora * 60 + minuto;
}

function obterHorarioSaoPaulo() {
  const partes =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Sao_Paulo",

        hour: "2-digit",
        minute: "2-digit",

        hour12: false,
      }
    ).formatToParts(
      new Date()
    );

  const hora = Number(
    partes.find(
      (parte) =>
        parte.type === "hour"
    )?.value ?? 0
  );

  const minuto = Number(
    partes.find(
      (parte) =>
        parte.type === "minute"
    )?.value ?? 0
  );

  return {
    hora,
    minuto,

    minutos:
      hora * 60 + minuto,
  };
}

function estaDentroDoHorario(
  agora: number,
  abertura: number,
  fechamento: number
) {
  /*
   * Exemplo normal:
   * 10:00 -> 22:00
   */
  if (
    abertura < fechamento
  ) {
    return (
      agora >= abertura &&
      agora < fechamento
    );
  }

  /*
   * Exemplo atravessando meia-noite:
   * 18:00 -> 02:00
   */
  if (
    abertura > fechamento
  ) {
    return (
      agora >= abertura ||
      agora < fechamento
    );
  }

  /*
   * Mesmo horário:
   * interpretamos como 24 horas aberto.
   */
  return true;
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loja, setLoja] =
    useState<LojaHorario | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    estaAberto,
    setEstaAberto,
  ] = useState(true);

  const verificarHorario = (
    dadosLoja: LojaHorario
  ) => {
    if (
      !dadosLoja.usar_horario
    ) {
      setEstaAberto(true);
      return;
    }

    if (
      !dadosLoja.horario_abertura ||
      !dadosLoja.horario_fechamento
    ) {
      setEstaAberto(true);
      return;
    }

    const agora =
      obterHorarioSaoPaulo();

    const abertura =
      minutosDoHorario(
        dadosLoja.horario_abertura
      );

    const fechamento =
      minutosDoHorario(
        dadosLoja.horario_fechamento
      );

    setEstaAberto(
      estaDentroDoHorario(
        agora.minutos,
        abertura,
        fechamento
      )
    );
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("lojas")
          .select(`
            id,
            nome,
            usar_horario,
            horario_abertura,
            horario_fechamento,
            mensagem_fora_horario
          `)
          .order(
            "id",
            {
              ascending: true,
            }
          )
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setEstaAberto(true);
          return;
        }

        const dados =
          data as LojaHorario;

        setLoja(dados);

        verificarHorario(
          dados
        );
      } catch (error) {
        console.error(
          "Erro ao verificar horário:",
          error
        );

        /*
         * Se der erro ao consultar,
         * não bloqueamos o cardápio.
         */
        setEstaAberto(true);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  useEffect(() => {
    if (!loja) {
      return;
    }

    /*
     * Revalida a cada 30 segundos.
     * Assim o cardápio abre e fecha
     * sem precisar atualizar a página.
     */
    const intervalo =
      setInterval(() => {
        verificarHorario(
          loja
        );
      }, 30000);

    return () =>
      clearInterval(
        intervalo
      );
  }, [loja]);

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

  if (
    loja?.usar_horario &&
    !estaAberto
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-zinc-950">
        <section className="w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <Store size={26} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-zinc-400">
            Cardápio fechado
          </p>

          <h1 className="mt-1 text-2xl font-extrabold">
            {loja.nome}
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {loja.mensagem_fora_horario ||
              "No momento estamos fechados. Volte no nosso horário de atendimento."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-zinc-100 p-4">
            <Clock3 size={20} />

            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Funcionamento
              </p>

              <p className="mt-0.5 font-extrabold">
                {loja.horario_abertura?.slice(
                  0,
                  5
                )}{" "}
                às{" "}
                {loja.horario_fechamento?.slice(
                  0,
                  5
                )}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[11px] text-zinc-400">
            O cardápio será liberado automaticamente no horário de funcionamento.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}