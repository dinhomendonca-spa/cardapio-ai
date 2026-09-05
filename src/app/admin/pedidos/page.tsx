"use client";

import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { useStore } from "@/context/StoreContext";

type StatusPedido =
  | "novo"
  | "em_preparo"
  | "saiu_para_entrega"
  | "concluido"
  | "cancelado";

type TipoEntrega =
  | "entrega"
  | "retirada";

type ItemPedido = {
  id: number;
  pedido_id: number;
  produto_id: number | null;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
};

type Pedido = {
  id: number;
  loja_id: number;

  cliente_nome: string;
  cliente_telefone: string;

  status: StatusPedido;

  tipo_entrega: TipoEntrega;

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

const ordemStatus: StatusPedido[] = [
  "novo",
  "em_preparo",
  "saiu_para_entrega",
  "concluido",
];

const statusInfo: Record<
  StatusPedido,
  {
    titulo: string;
    descricao: string;
    classe: string;
  }
> = {
  novo: {
    titulo: "Novo",
    descricao: "Pedido recebido",
    classe:
      "bg-blue-50 text-blue-700",
  },

  em_preparo: {
    titulo: "Em preparo",
    descricao:
      "Pedido sendo preparado",
    classe:
      "bg-amber-50 text-amber-700",
  },

  saiu_para_entrega: {
    titulo: "Saiu para entrega",
    descricao:
      "Pedido com o motoboy",
    classe:
      "bg-violet-50 text-violet-700",
  },

  concluido: {
    titulo: "Concluído",
    descricao:
      "Pedido finalizado",
    classe:
      "bg-green-50 text-green-700",
  },

  cancelado: {
    titulo: "Cancelado",
    descricao:
      "Pedido cancelado",
    classe:
      "bg-red-50 text-red-700",
  },
};

export default function PedidosPage() {
  const { loja } = useStore();

  const [
    pedidos,
    setPedidos,
  ] = useState<Pedido[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizandoId,
    setAtualizandoId,
  ] = useState<number | null>(
    null
  );

  const [
    pedidoAberto,
    setPedidoAberto,
  ] = useState<number | null>(
    null
  );

  const [
    somAtivado,
    setSomAtivado,
  ] = useState(true);

  const [
    novoPedido,
    setNovoPedido,
  ] = useState<Pedido | null>(
    null
  );

  const [
    conectadoRealtime,
    setConectadoRealtime,
  ] = useState(false);

  const audioContextRef =
    useRef<AudioContext | null>(
      null
    );

  const formatarPreco = (
    valor: number
  ) =>
    Number(valor).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );

  const formatarData = (
    data: string
  ) => {
    return new Date(
      data
    ).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarTelefone = (
    telefone: string
  ) => {
    const numeros = (
      telefone || ""
    ).replace(/\D/g, "");

    if (
      numeros.length === 11
    ) {
      return `(${numeros.slice(
        0,
        2
      )}) ${numeros.slice(
        2,
        7
      )}-${numeros.slice(7)}`;
    }

    if (
      numeros.length === 10
    ) {
      return `(${numeros.slice(
        0,
        2
      )}) ${numeros.slice(
        2,
        6
      )}-${numeros.slice(6)}`;
    }

    return telefone || "Não informado";
  };

  const linkWhatsAppCliente = (
    pedido: Pedido
  ) => {
    const numero = (
      pedido.cliente_telefone ||
      ""
    ).replace(/\D/g, "");

    if (!numero) {
      return "";
    }

    const numeroComPais =
      numero.startsWith("55")
        ? numero
        : `55${numero}`;

    const mensagem = `Olá, ${pedido.cliente_nome || "cliente"}! 👋

Estou entrando em contato sobre o seu pedido #${pedido.id} na ${loja?.nome || "loja"}.

Status atual: ${statusInfo[pedido.status].titulo}.`;

    return `https://wa.me/${numeroComPais}?text=${encodeURIComponent(
      mensagem
    )}`;
  };

  const tocarSomNovoPedido =
    useCallback(() => {
      if (!somAtivado) {
        return;
      }

      try {
        const AudioContextClass =
          window.AudioContext;

        if (
          !AudioContextClass
        ) {
          return;
        }

        if (
          !audioContextRef.current
        ) {
          audioContextRef.current =
            new AudioContextClass();
        }

        const contexto =
          audioContextRef.current;

        if (
          contexto.state ===
          "suspended"
        ) {
          contexto.resume();
        }

        const agora =
          contexto.currentTime;

        const criarTom = (
          frequencia: number,
          inicio: number,
          duracao: number
        ) => {
          const oscillator =
            contexto.createOscillator();

          const gain =
            contexto.createGain();

          oscillator.type =
            "sine";

          oscillator.frequency.value =
            frequencia;

          gain.gain.setValueAtTime(
            0.0001,
            agora + inicio
          );

          gain.gain.exponentialRampToValueAtTime(
            0.25,
            agora +
              inicio +
              0.02
          );

          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            agora +
              inicio +
              duracao
          );

          oscillator.connect(
            gain
          );

          gain.connect(
            contexto.destination
          );

          oscillator.start(
            agora + inicio
          );

          oscillator.stop(
            agora +
              inicio +
              duracao
          );
        };

        criarTom(
          880,
          0,
          0.18
        );

        criarTom(
          1100,
          0.2,
          0.22
        );
      } catch (error) {
        console.error(
          "Erro ao tocar som:",
          error
        );
      }
    }, [somAtivado]);

  const carregarPedidos =
    useCallback(
      async (
        mostrarLoading = true
      ) => {
        if (!loja) {
          setCarregando(false);
          return;
        }

        try {
          if (
            mostrarLoading
          ) {
            setCarregando(
              true
            );
          }

          const {
            data,
            error,
          } = await supabase
            .from("pedidos")
            .select(`
              *,
              pedido_itens (
                id,
                pedido_id,
                produto_id,
                nome,
                preco,
                quantidade,
                subtotal
              )
            `)
            .eq(
              "loja_id",
              loja.id
            )
            .order(
              "criado_em",
              {
                ascending:
                  false,
              }
            );

          if (error) {
            throw error;
          }

          setPedidos(
            (data ??
              []) as Pedido[]
          );
        } catch (error) {
          console.error(
            "Erro ao carregar pedidos:",
            error
          );

          if (
            mostrarLoading
          ) {
            alert(
              "Não foi possível carregar os pedidos."
            );
          }
        } finally {
          if (
            mostrarLoading
          ) {
            setCarregando(
              false
            );
          }
        }
      },
      [loja]
    );

  const carregarPedidoPorId =
    useCallback(
      async (
        pedidoId: number
      ) => {
        const {
          data,
          error,
        } = await supabase
          .from("pedidos")
          .select(`
            *,
            pedido_itens (
              id,
              pedido_id,
              produto_id,
              nome,
              preco,
              quantidade,
              subtotal
            )
          `)
          .eq(
            "id",
            pedidoId
          )
          .single();

        if (error) {
          console.error(
            "Erro ao carregar pedido:",
            error
          );

          return null;
        }

        return data as Pedido;
      },
      []
    );

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  /*
   * REALTIME
   */
  useEffect(() => {
    if (!loja) {
      return;
    }

    const canal =
      supabase
        .channel(
          `pedidos-loja-${loja.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "pedidos",
            filter: `loja_id=eq.${loja.id}`,
          },
          async (
            payload
          ) => {
            const pedidoId =
              Number(
                payload.new.id
              );

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  500
                )
            );

            const pedido =
              await carregarPedidoPorId(
                pedidoId
              );

            if (!pedido) {
              await carregarPedidos(
                false
              );

              return;
            }

            setPedidos(
              (atual) => {
                const existe =
                  atual.some(
                    (item) =>
                      item.id ===
                      pedido.id
                  );

                if (existe) {
                  return atual;
                }

                return [
                  pedido,
                  ...atual,
                ];
              }
            );

            setNovoPedido(
              pedido
            );

            tocarSomNovoPedido();

            if (
              "vibrate" in
              navigator
            ) {
              navigator.vibrate(
                [
                  180,
                  100,
                  180,
                ]
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "pedidos",
            filter: `loja_id=eq.${loja.id}`,
          },
          async (
            payload
          ) => {
            const pedidoId =
              Number(
                payload.new.id
              );

            const pedido =
              await carregarPedidoPorId(
                pedidoId
              );

            if (!pedido) {
              return;
            }

            setPedidos(
              (atual) =>
                atual.map(
                  (item) =>
                    item.id ===
                    pedido.id
                      ? pedido
                      : item
                )
            );
          }
        )
        .subscribe(
          (status) => {
            setConectadoRealtime(
              status ===
                "SUBSCRIBED"
            );
          }
        );

    return () => {
      supabase.removeChannel(
        canal
      );
    };
  }, [
    loja,
    carregarPedidoPorId,
    carregarPedidos,
    tocarSomNovoPedido,
  ]);

  /*
   * FALLBACK
   */
  useEffect(() => {
    if (!loja) {
      return;
    }

    const intervalo =
      setInterval(() => {
        carregarPedidos(
          false
        );
      }, 30000);

    return () => {
      clearInterval(
        intervalo
      );
    };
  }, [
    loja,
    carregarPedidos,
  ]);

  /*
   * LIBERA ÁUDIO
   */
  useEffect(() => {
    const liberarAudio =
      () => {
        try {
          if (
            audioContextRef
              .current
              ?.state ===
            "suspended"
          ) {
            audioContextRef.current.resume();
          }
        } catch {
          // ignora
        }
      };

    window.addEventListener(
      "pointerdown",
      liberarAudio,
      {
        once: true,
      }
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        liberarAudio
      );
    };
  }, []);

  const alterarStatus =
    async (
      pedidoId: number,
      novoStatus: StatusPedido
    ) => {
      try {
        setAtualizandoId(
          pedidoId
        );

        const { error } =
          await supabase
            .from("pedidos")
            .update({
              status:
                novoStatus,
            })
            .eq(
              "id",
              pedidoId
            );

        if (error) {
          throw error;
        }

        setPedidos(
          (atual) =>
            atual.map(
              (pedido) =>
                pedido.id ===
                pedidoId
                  ? {
                      ...pedido,
                      status:
                        novoStatus,
                    }
                  : pedido
            )
        );
      } catch (error) {
        console.error(
          "Erro ao atualizar status:",
          error
        );

        alert(
          "Não foi possível atualizar o pedido."
        );
      } finally {
        setAtualizandoId(
          null
        );
      }
    };

  const avancarStatus =
    async (
      pedido: Pedido
    ) => {
      const indiceAtual =
        ordemStatus.indexOf(
          pedido.status
        );

      if (
        indiceAtual === -1
      ) {
        return;
      }

      const proximoStatus =
        ordemStatus[
          indiceAtual + 1
        ];

      if (
        !proximoStatus
      ) {
        return;
      }

      await alterarStatus(
        pedido.id,
        proximoStatus
      );
    };

  const totais =
    useMemo(() => {
      return {
        novos:
          pedidos.filter(
            (pedido) =>
              pedido.status ===
              "novo"
          ).length,

        preparo:
          pedidos.filter(
            (pedido) =>
              pedido.status ===
              "em_preparo"
          ).length,

        entrega:
          pedidos.filter(
            (pedido) =>
              pedido.status ===
              "saiu_para_entrega"
          ).length,
      };
    }, [pedidos]);

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 active:scale-95"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-zinc-500">
              {loja?.nome ||
                "Sua loja"}
            </p>

            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold">
                Pedidos
              </h1>

              <span
                className={`h-2 w-2 rounded-full ${
                  conectadoRealtime
                    ? "bg-green-500"
                    : "bg-amber-400"
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSomAtivado(
                (atual) =>
                  !atual
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100"
          >
            {somAtivado ? (
              <Volume2
                size={18}
              />
            ) : (
              <VolumeX
                size={18}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              carregarPedidos()
            }
            disabled={
              carregando
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={
                carregando
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </header>

      {/* ALERTA NOVO PEDIDO */}
      {novoPedido && (
        <div className="sticky top-[69px] z-30 px-3 pt-3">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-green-600 p-3 text-white shadow-xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <BellRing
                size={21}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setPedidoAberto(
                  novoPedido.id
                );

                setNovoPedido(
                  null
                );
              }}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-[11px] font-medium text-green-100">
                NOVO PEDIDO
              </p>

              <p className="font-extrabold">
                {novoPedido.cliente_nome ||
                  `Pedido #${novoPedido.id}`}
              </p>

              <p className="text-xs text-green-100">
                Pedido #
                {novoPedido.id} •{" "}
                {formatarPreco(
                  novoPedido.total
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setNovoPedido(
                  null
                )
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        {/* REALTIME */}
        <div className="flex items-center gap-2 px-1 text-[10px] font-medium text-zinc-500">
          {conectadoRealtime ? (
            <>
              <Bell
                size={12}
                className="text-green-600"
              />

              Pedidos em tempo real
            </>
          ) : (
            <>
              <RefreshCw
                size={12}
              />

              Atualização automática ativa
            </>
          )}
        </div>

        {/* RESUMO */}
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Novos
            </p>

            <p className="mt-1 text-2xl font-extrabold">
              {totais.novos}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Preparo
            </p>

            <p className="mt-1 text-2xl font-extrabold">
              {totais.preparo}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Entrega
            </p>

            <p className="mt-1 text-2xl font-extrabold">
              {totais.entrega}
            </p>
          </div>
        </section>

        {/* LISTA */}
        {carregando ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-zinc-400"
            />

            <p className="mt-3 text-sm font-semibold">
              Carregando pedidos...
            </p>
          </section>
        ) : pedidos.length ===
          0 ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <ShoppingBag
              size={34}
              className="mx-auto text-zinc-300"
            />

            <h2 className="mt-3 font-extrabold">
              Nenhum pedido ainda
            </h2>

            <p className="mt-1 text-sm leading-5 text-zinc-500">
              Os novos pedidos aparecerão aqui automaticamente.
            </p>
          </section>
        ) : (
          <div className="space-y-3">
            {pedidos.map(
              (pedido) => {
                const info =
                  statusInfo[
                    pedido.status
                  ];

                const aberto =
                  pedidoAberto ===
                  pedido.id;

                const endereco =
                  pedido.tipo_entrega ===
                  "entrega"
                    ? [
                        pedido.rua,
                        pedido.numero,
                        pedido.bairro,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(", ")
                    : "Retirada no local";

                const podeAvancar =
                  pedido.status !==
                    "concluido" &&
                  pedido.status !==
                    "cancelado";

                const whatsappCliente =
                  linkWhatsAppCliente(
                    pedido
                  );

                return (
                  <article
                    key={
                      pedido.id
                    }
                    className={`overflow-hidden rounded-3xl bg-white shadow-sm ${
                      pedido.status ===
                      "novo"
                        ? "ring-2 ring-blue-100"
                        : ""
                    }`}
                  >
                    <div className="p-4">
                      {/* CABEÇALHO */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-extrabold">
                              Pedido #
                              {
                                pedido.id
                              }
                            </h2>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${info.classe}`}
                            >
                              {
                                info.titulo
                              }
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                            <Clock3
                              size={
                                14
                              }
                            />

                            {formatarData(
                              pedido.criado_em
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                            Total
                          </p>

                          <p className="mt-0.5 text-lg font-extrabold">
                            {formatarPreco(
                              pedido.total
                            )}
                          </p>
                        </div>
                      </div>

                      {/* CLIENTE */}
                      <div className="mt-4 rounded-2xl bg-zinc-950 p-3 text-white">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                            <User
                              size={
                                17
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                              Cliente
                            </p>

                            <p className="mt-0.5 truncate text-sm font-extrabold">
                              {pedido.cliente_nome ||
                                "Cliente não informado"}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-300">
                              <Phone
                                size={
                                  13
                                }
                              />

                              <span>
                                {formatarTelefone(
                                  pedido.cliente_telefone
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {whatsappCliente && (
                          <a
                            href={
                              whatsappCliente
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-xs font-bold text-white active:scale-[0.99]"
                          >
                            <MessageCircle
                              size={
                                16
                              }
                            />

                            WhatsApp do cliente
                          </a>
                        )}
                      </div>

                      {/* RECEBIMENTO */}
                      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-zinc-50 p-3">
                        {pedido.tipo_entrega ===
                        "entrega" ? (
                          <Truck
                            size={17}
                            className="mt-0.5 shrink-0"
                          />
                        ) : (
                          <ShoppingBag
                            size={17}
                            className="mt-0.5 shrink-0"
                          />
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold">
                            {pedido.tipo_entrega ===
                            "entrega"
                              ? "Entrega"
                              : "Retirada"}
                          </p>

                          <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                            {endereco}
                          </p>

                          {pedido.complemento && (
                            <p className="text-xs leading-5 text-zinc-500">
                              {
                                pedido.complemento
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ITENS */}
                      <button
                        type="button"
                        onClick={() =>
                          setPedidoAberto(
                            aberto
                              ? null
                              : pedido.id
                          )
                        }
                        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl bg-zinc-100 px-3 text-left"
                      >
                        <span className="text-xs font-bold">
                          Ver itens do pedido
                        </span>

                        {aberto ? (
                          <ChevronUp
                            size={
                              17
                            }
                          />
                        ) : (
                          <ChevronDown
                            size={
                              17
                            }
                          />
                        )}
                      </button>

                      {aberto && (
                        <div className="mt-3 rounded-2xl border border-zinc-100 p-3">
                          <div className="space-y-2.5">
                            {pedido.pedido_itens.map(
                              (
                                item
                              ) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="flex justify-between gap-3 text-sm"
                                >
                                  <span className="min-w-0 text-zinc-600">
                                    {
                                      item.quantidade
                                    }
                                    x{" "}
                                    {
                                      item.nome
                                    }
                                  </span>

                                  <span className="shrink-0 font-semibold">
                                    {formatarPreco(
                                      item.subtotal
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 text-xs">
                            <div className="flex justify-between text-zinc-500">
                              <span>
                                Produtos
                              </span>

                              <span>
                                {formatarPreco(
                                  pedido.subtotal
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between text-zinc-500">
                              <span>
                                Entrega
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

                            <div className="flex justify-between pt-1 font-bold">
                              <span>
                                Total
                              </span>

                              <span>
                                {formatarPreco(
                                  pedido.total
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MAPS */}
                      {pedido.tipo_entrega ===
                        "entrega" &&
                        pedido.rua && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              [
                                pedido.rua,
                                pedido.numero,
                                pedido.bairro,
                                loja?.cidade,
                                loja?.estado,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ", "
                                )
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-xs font-bold"
                          >
                            <MapPin
                              size={
                                15
                              }
                            />

                            Abrir endereço no Maps
                          </a>
                        )}

                      {/* AÇÕES */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {podeAvancar ? (
                          <button
                            type="button"
                            onClick={() =>
                              avancarStatus(
                                pedido
                              )
                            }
                            disabled={
                              atualizandoId ===
                              pedido.id
                            }
                            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-3 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {pedido.status ===
                              "novo" && (
                              <>
                                <PackageCheck
                                  size={
                                    16
                                  }
                                />

                                Iniciar preparo
                              </>
                            )}

                            {pedido.status ===
                              "em_preparo" && (
                              <>
                                <Truck
                                  size={
                                    16
                                  }
                                />

                                Saiu para entrega
                              </>
                            )}

                            {pedido.status ===
                              "saiu_para_entrega" && (
                              <>
                                <CheckCircle2
                                  size={
                                    16
                                  }
                                />

                                Concluir
                              </>
                            )}
                          </button>
                        ) : (
                          <div
                            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold ${info.classe}`}
                          >
                            {pedido.status ===
                            "concluido" ? (
                              <>
                                <CheckCircle2
                                  size={
                                    16
                                  }
                                />

                                Concluído
                              </>
                            ) : (
                              <>
                                <XCircle
                                  size={
                                    16
                                  }
                                />

                                Cancelado
                              </>
                            )}
                          </div>
                        )}

                        {pedido.status !==
                          "concluido" &&
                          pedido.status !==
                            "cancelado" && (
                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus(
                                  pedido.id,
                                  "cancelado"
                                )
                              }
                              disabled={
                                atualizandoId ===
                                pedido.id
                              }
                              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 text-xs font-bold text-red-600 disabled:opacity-50"
                            >
                              <XCircle
                                size={
                                  16
                                }
                              />

                              Cancelar
                            </button>
                          )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}