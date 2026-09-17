"use client";

import {
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Home,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useStore } from "@/context/StoreContext";

type StatusPedido =
  | "novo"
  | "em_preparo"
  | "saiu_para_entrega"
  | "concluido"
  | "cancelado";

type ItemPedido = {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
};

type Pedido = {
  id: number;
  status: StatusPedido;
  tipo_entrega: "entrega" | "retirada";
  forma_pagamento: string;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  criado_em: string;
  pedido_itens: ItemPedido[];
};

const etapas = [
  {
    status: "novo" as StatusPedido,
    titulo: "Pedido recebido",
    descricao: "A loja recebeu seu pedido.",
    icone: PackageCheck,
  },
  {
    status: "em_preparo" as StatusPedido,
    titulo: "Em preparo",
    descricao: "Seu pedido está sendo preparado.",
    icone: ChefHat,
  },
  {
    status: "saiu_para_entrega" as StatusPedido,
    titulo: "Saiu para entrega",
    descricao: "Seu pedido está a caminho.",
    icone: Truck,
  },
  {
    status: "concluido" as StatusPedido,
    titulo: "Concluído",
    descricao: "Pedido finalizado.",
    icone: CheckCircle2,
  },
];

export default function AcompanharPedidoPage() {
  const params = useParams();

  const { loja } = useStore();

  const pedidoId = Number(params.id);

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [conectado, setConectado] =
    useState(false);

  const formatarPreco = (valor: number) =>
    Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const carregarPedido = useCallback(async () => {
    if (!pedidoId || Number.isNaN(pedidoId)) {
      setCarregando(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          pedido_itens (
            id,
            nome,
            preco,
            quantidade,
            subtotal
          )
        `)
        .eq("id", pedidoId)
        .single();

      if (error) {
        throw error;
      }

      setPedido(data as Pedido);
    } catch (error) {
      console.error(
        "Erro ao carregar pedido:",
        error
      );
    } finally {
      setCarregando(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    carregarPedido();
  }, [carregarPedido]);

  useEffect(() => {
    if (!pedidoId || Number.isNaN(pedidoId)) {
      return;
    }

    const canal = supabase
      .channel(`cliente-pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedidoId}`,
        },
        async () => {
          await carregarPedido();

          if ("vibrate" in navigator) {
            navigator.vibrate([150, 80, 150]);
          }
        }
      )
      .subscribe((status) => {
        setConectado(
          status === "SUBSCRIBED"
        );
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [
    pedidoId,
    carregarPedido,
  ]);

  const indiceAtual = useMemo(() => {
    if (!pedido) return -1;

    return etapas.findIndex(
      (etapa) =>
        etapa.status === pedido.status
    );
  }, [pedido]);

  const statusAtual = useMemo(() => {
    if (!pedido) return null;

    if (pedido.status === "cancelado") {
      return {
        titulo: "Pedido cancelado",
        descricao:
          "Este pedido foi cancelado.",
        icone: XCircle,
      };
    }

    return (
      etapas.find(
        (etapa) =>
          etapa.status === pedido.status
      ) ?? etapas[0]
    );
  }, [pedido]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <RefreshCw
          size={28}
          className="animate-spin text-zinc-500"
        />
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
          <ShoppingBag
            size={34}
            className="mx-auto text-zinc-300"
          />

          <h1 className="mt-4 text-xl font-extrabold">
            Pedido não encontrado
          </h1>

          <Link
            href="/menu"
            className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-zinc-950 font-bold text-white"
          >
            Voltar à loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-md px-4 py-4">
          <p className="text-xs text-zinc-500">
            {loja?.nome || "Sua loja"}
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold">
              Pedido #{pedido.id}
            </h1>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  conectado
                    ? "bg-green-500"
                    : "bg-amber-400"
                }`}
              />

              {conectado
                ? "Atualização ao vivo"
                : "Conectando..."}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        {/* STATUS ATUAL */}
        <section
          className={`rounded-3xl p-5 shadow-sm ${
            pedido.status === "cancelado"
              ? "bg-red-50"
              : "bg-zinc-950 text-white"
          }`}
        >
          {statusAtual && (
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  pedido.status === "cancelado"
                    ? "bg-red-100 text-red-600"
                    : "bg-white/10"
                }`}
              >
                <statusAtual.icone
                  size={22}
                />
              </div>

              <div>
                <p
                  className={`text-xs ${
                    pedido.status ===
                    "cancelado"
                      ? "text-red-600"
                      : "text-zinc-400"
                  }`}
                >
                  Status atual
                </p>

                <h2 className="mt-1 text-xl font-extrabold">
                  {statusAtual.titulo}
                </h2>

                <p
                  className={`mt-1 text-sm ${
                    pedido.status ===
                    "cancelado"
                      ? "text-red-700"
                      : "text-zinc-300"
                  }`}
                >
                  {statusAtual.descricao}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* LINHA DO TEMPO */}
        {pedido.status !== "cancelado" && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-extrabold">
              Acompanhe seu pedido
            </h2>

            <div className="mt-5">
              {etapas.map(
                (etapa, index) => {
                  const Icon =
                    etapa.icone;

                  const concluida =
                    index <= indiceAtual;

                  const atual =
                    index === indiceAtual;

                  return (
                    <div
                      key={etapa.status}
                      className="relative flex gap-4 pb-7 last:pb-0"
                    >
                      {index <
                        etapas.length -
                          1 && (
                        <div
                          className={`absolute left-[19px] top-10 h-[calc(100%-24px)] w-0.5 ${
                            index <
                            indiceAtual
                              ? "bg-zinc-950"
                              : "bg-zinc-200"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          concluida
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {index <
                        indiceAtual ? (
                          <Check
                            size={17}
                          />
                        ) : (
                          <Icon
                            size={17}
                          />
                        )}
                      </div>

                      <div className="pt-0.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-bold ${
                              concluida
                                ? "text-zinc-950"
                                : "text-zinc-400"
                            }`}
                          >
                            {
                              etapa.titulo
                            }
                          </p>

                          {atual && (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold uppercase text-green-700">
                              Agora
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          {
                            etapa.descricao
                          }
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* RESUMO */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">
              Seu pedido
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock3 size={14} />

              {new Date(
                pedido.criado_em
              ).toLocaleTimeString(
                "pt-BR",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {pedido.pedido_itens.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-600">
                    {item.quantidade}x{" "}
                    {item.nome}
                  </span>

                  <span className="font-semibold">
                    {formatarPreco(
                      item.subtotal
                    )}
                  </span>
                </div>
              )
            )}

            <div className="border-t border-zinc-100 pt-3">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Produtos</span>
                <span>
                  {formatarPreco(
                    pedido.subtotal
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm text-zinc-500">
                <span>
                  {pedido.tipo_entrega ===
                  "entrega"
                    ? "Entrega"
                    : "Retirada"}
                </span>

                <span>
                  {pedido.taxa_entrega ===
                  0
                    ? "Grátis"
                    : formatarPreco(
                        pedido.taxa_entrega
                      )}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-xl font-extrabold">
                  {formatarPreco(
                    pedido.total
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ENTREGA */}
        {pedido.tipo_entrega ===
          "entrega" && (
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <MapPin size={18} />
              </div>

              <div>
                <h2 className="text-sm font-extrabold">
                  Entrega
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {pedido.rua},{" "}
                  {pedido.numero}
                  <br />
                  {pedido.bairro}
                  {pedido.complemento
                    ? ` • ${pedido.complemento}`
                    : ""}
                </p>
              </div>
            </div>
          </section>
        )}

        <Link
          href="/menu"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold shadow-sm"
        >
          <Home size={17} />
          Voltar à loja
        </Link>
      </section>
    </main>
  );
}
