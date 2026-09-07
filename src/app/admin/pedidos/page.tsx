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
  }
> = {
  novo: {
    titulo: "Novo",
    descricao: "Pedido recebido",
  },

  em_preparo: {
    titulo: "Em preparo",
    descricao: "Pedido sendo preparado",
  },

  saiu_para_entrega: {
    titulo: "Saiu para entrega",
    descricao: "Pedido com o motoboy",
  },

  concluido: {
    titulo: "Concluído",
    descricao: "Pedido finalizado",
  },

  cancelado: {
    titulo: "Cancelado",
    descricao: "Pedido cancelado",
  },
};

export default function PedidosPage() {
  const {
    loja,
  } = useStore();

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
    Number(
      valor
    ).toLocaleString(
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
    ).toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatarTelefone = (
    telefone: string
  ) => {
    const numeros = (
      telefone || ""
    ).replace(
      /\D/g,
      ""
    );

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

    return (
      telefone ||
      "Não informado"
    );
  };

  const linkWhatsAppCliente = (
    pedido: Pedido
  ) => {
    const numero = (
      pedido.cliente_telefone ||
      ""
    ).replace(
      /\D/g,
      ""
    );

    if (!numero) {
      return "";
    }

    const numeroComPais =
      numero.startsWith(
        "55"
      )
        ? numero
        : `55${numero}`;

    const mensagem = `Olá, ${
      pedido.cliente_nome ||
      "cliente"
    }! 👋

Estou entrando em contato sobre o seu pedido #${pedido.id} na ${
      loja?.nome ||
      "loja"
    }.

Status atual: ${
      statusInfo[
        pedido.status
      ].titulo
    }.`;

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
            agora +
              inicio
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
      } catch (
        error
      ) {
        console.error(
          "Erro ao tocar som:",
          error
        );
      }
    }, [
      somAtivado,
    ]);

  const carregarPedidos =
    useCallback(
      async (
        mostrarLoading = true
      ) => {
        if (!loja) {
          setCarregando(
            false
          );

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
          } =
            await supabase
              .from(
                "pedidos"
              )
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
        } catch (
          error
        ) {
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
      [
        loja,
      ]
    );

  const carregarPedidoPorId =
    useCallback(
      async (
        pedidoId: number
      ) => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "pedidos"
            )
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

        return (
          data as Pedido
        );
      },
      []
    );

  useEffect(() => {
    carregarPedidos();
  }, [
    carregarPedidos,
  ]);

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
            event:
              "INSERT",

            schema:
              "public",

            table:
              "pedidos",

            filter:
              `loja_id=eq.${loja.id}`,
          },
          async (
            payload
          ) => {
            const pedidoId =
              Number(
                payload.new.id
              );

            await new Promise(
              (
                resolve
              ) =>
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
              (
                atual
              ) => {
                const existe =
                  atual.some(
                    (
                      item
                    ) =>
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
            event:
              "UPDATE",

            schema:
              "public",

            table:
              "pedidos",

            filter:
              `loja_id=eq.${loja.id}`,
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
              (
                atual
              ) =>
                atual.map(
                  (
                    item
                  ) =>
                    item.id ===
                    pedido.id
                      ? pedido
                      : item
                )
            );
          }
        )
        .subscribe(
          (
            status
          ) => {
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
      setInterval(
        () => {
          carregarPedidos(
            false
          );
        },
        30000
      );

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

        const {
          error,
        } =
          await supabase
            .from(
              "pedidos"
            )
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
          (
            atual
          ) =>
            atual.map(
              (
                pedido
              ) =>
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
      } catch (
        error
      ) {
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
        indiceAtual ===
        -1
      ) {
        return;
      }

      const proximoStatus =
        ordemStatus[
          indiceAtual +
            1
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
            (
              pedido
            ) =>
              pedido.status ===
              "novo"
          ).length,

        preparo:
          pedidos.filter(
            (
              pedido
            ) =>
              pedido.status ===
              "em_preparo"
          ).length,

        entrega:
          pedidos.filter(
            (
              pedido
            ) =>
              pedido.status ===
              "saiu_para_entrega"
          ).length,
      };
    }, [
      pedidos,
    ]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b18] pb-12 text-white">

      {/* FUNDO */}

      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-44 top-72 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-sky-300/10 bg-[#020b18]/80 backdrop-blur-2xl">

        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4">

          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/15 bg-white/[0.06] text-sky-200 shadow-lg backdrop-blur-xl transition hover:border-sky-300/30 hover:bg-sky-400/10 active:scale-95"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0 flex-1">

            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-300">
              {loja?.nome ||
                "Sua loja"}
            </p>

            <div className="mt-1 flex items-center gap-2">

              <h1 className="text-xl font-black">
                Pedidos
              </h1>

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  conectadoRealtime
                    ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                    : "bg-amber-400"
                }`}
              />

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setSomAtivado(
                (
                  atual
                ) =>
                  !atual
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/15 bg-white/[0.06] text-sky-200 backdrop-blur-xl transition hover:border-sky-300/30 hover:bg-sky-400/10"
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
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/15 bg-white/[0.06] text-sky-200 backdrop-blur-xl transition hover:border-sky-300/30 hover:bg-sky-400/10 disabled:opacity-50"
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

      {/* NOVO PEDIDO */}

      {novoPedido && (
        <div className="sticky top-[77px] z-30 px-4 pt-3">

          <div className="mx-auto flex max-w-md items-center gap-3 rounded-[24px] border border-emerald-300/30 bg-emerald-500/20 p-3 text-white shadow-[0_15px_45px_rgba(16,185,129,0.25)] backdrop-blur-2xl">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">

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

              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Novo pedido
              </p>

              <p className="truncate font-black">
                {novoPedido.cliente_nome ||
                  `Pedido #${novoPedido.id}`}
              </p>

              <p className="text-xs text-emerald-100/70">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"
            >
              <X
                size={17}
              />
            </button>

          </div>

        </div>
      )}

      {/* CONTEÚDO */}

      <section className="relative z-10 mx-auto max-w-md space-y-4 px-4 py-5">

        {/* REALTIME */}

        <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-400">

          {conectadoRealtime ? (
            <>
              <Bell
                size={13}
                className="text-emerald-400"
              />

              Pedidos em tempo real
            </>
          ) : (
            <>
              <RefreshCw
                size={13}
                className="text-amber-300"
              />

              Atualização automática ativa
            </>
          )}

        </div>

        {/* RESUMO */}

        <section className="grid grid-cols-3 gap-2">

          <div className="rounded-[22px] border border-sky-300/15 bg-white/[0.06] p-4 shadow-lg backdrop-blur-2xl">

            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Novos
            </p>

            <p className="mt-1 text-2xl font-black text-sky-300">
              {totais.novos}
            </p>

          </div>

          <div className="rounded-[22px] border border-amber-300/15 bg-white/[0.06] p-4 shadow-lg backdrop-blur-2xl">

            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Preparo
            </p>

            <p className="mt-1 text-2xl font-black text-amber-300">
              {totais.preparo}
            </p>

          </div>

          <div className="rounded-[22px] border border-violet-300/15 bg-white/[0.06] p-4 shadow-lg backdrop-blur-2xl">

            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Entrega
            </p>

            <p className="mt-1 text-2xl font-black text-violet-300">
              {totais.entrega}
            </p>

          </div>

        </section>

        {/* CARREGANDO */}

        {carregando ? (
          <section className="rounded-[30px] border border-sky-300/15 bg-white/[0.055] p-10 text-center shadow-2xl backdrop-blur-2xl">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-sky-300"
            />

            <p className="mt-4 text-sm font-bold text-slate-300">
              Carregando pedidos...
            </p>

          </section>
        ) : pedidos.length ===
          0 ? (
          <section className="rounded-[30px] border border-sky-300/15 bg-white/[0.055] p-10 text-center shadow-2xl backdrop-blur-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-sky-300/15 bg-sky-400/10">

              <ShoppingBag
                size={30}
                className="text-sky-300"
              />

            </div>

            <h2 className="mt-4 font-black">
              Nenhum pedido ainda
            </h2>

            <p className="mt-2 text-sm leading-5 text-slate-400">
              Os novos pedidos aparecerão aqui automaticamente.
            </p>

          </section>
        ) : (
          <div className="space-y-4">

            {pedidos.map(
              (
                pedido
              ) => {
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
                        .join(
                          ", "
                        )
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
                    className={`overflow-hidden rounded-[30px] border bg-white/[0.055] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${
                      pedido.status ===
                      "novo"
                        ? "border-sky-300/40 shadow-[0_15px_50px_rgba(14,165,233,0.15)]"
                        : "border-white/[0.08]"
                    }`}
                  >

                    <div className="p-4">

                      {/* CABEÇALHO */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h2 className="text-lg font-black text-white">
                              Pedido #
                              {pedido.id}
                            </h2>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                                pedido.status ===
                                "novo"
                                  ? "border-sky-300/20 bg-sky-400/10 text-sky-300"
                                  : pedido.status ===
                                    "em_preparo"
                                  ? "border-amber-300/20 bg-amber-400/10 text-amber-300"
                                  : pedido.status ===
                                    "saiu_para_entrega"
                                  ? "border-violet-300/20 bg-violet-400/10 text-violet-300"
                                  : pedido.status ===
                                    "concluido"
                                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                                  : "border-red-300/20 bg-red-400/10 text-red-300"
                              }`}
                            >
                              {info.titulo}
                            </span>

                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">

                            <Clock3
                              size={14}
                            />

                            {formatarData(
                              pedido.criado_em
                            )}

                          </div>

                        </div>

                        <div className="shrink-0 text-right">

                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Total
                          </p>

                          <p className="mt-1 text-lg font-black text-sky-300">
                            {formatarPreco(
                              pedido.total
                            )}
                          </p>

                        </div>

                      </div>

                      {/* CLIENTE */}

                      <div className="mt-4 rounded-[22px] border border-sky-300/10 bg-[#020b18]/50 p-4 backdrop-blur-xl">

                        <div className="flex items-start gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-400/10 text-sky-300">

                            <User
                              size={18}
                            />

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              Cliente
                            </p>

                            <p className="mt-1 truncate text-sm font-black">
                              {pedido.cliente_nome ||
                                "Cliente não informado"}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">

                              <Phone
                                size={13}
                              />

                              {formatarTelefone(
                                pedido.cliente_telefone
                              )}

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
                            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/15 px-3 text-xs font-black text-emerald-300 backdrop-blur-xl transition hover:bg-emerald-500/20"
                          >
                            <MessageCircle
                              size={16}
                            />

                            WhatsApp do cliente
                          </a>
                        )}

                      </div>

                      {/* RECEBIMENTO */}

                      <div className="mt-3 flex items-start gap-3 rounded-[22px] border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-xl">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">

                          {pedido.tipo_entrega ===
                          "entrega" ? (
                            <Truck
                              size={17}
                            />
                          ) : (
                            <ShoppingBag
                              size={17}
                            />
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-black">
                            {pedido.tipo_entrega ===
                            "entrega"
                              ? "Entrega"
                              : "Retirada"}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {endereco}
                          </p>

                          {pedido.complemento && (
                            <p className="text-xs leading-5 text-slate-400">
                              {pedido.complemento}
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
                        className="mt-3 flex min-h-12 w-full items-center justify-between rounded-[20px] border border-sky-300/10 bg-white/[0.05] px-4 text-left backdrop-blur-xl transition hover:bg-sky-400/[0.07]"
                      >

                        <span className="text-xs font-black text-slate-200">
                          Ver itens do pedido
                        </span>

                        {aberto ? (
                          <ChevronUp
                            size={17}
                            className="text-sky-300"
                          />
                        ) : (
                          <ChevronDown
                            size={17}
                            className="text-sky-300"
                          />
                        )}

                      </button>

                      {aberto && (
                        <div className="mt-3 rounded-[22px] border border-sky-300/10 bg-[#020b18]/40 p-4 backdrop-blur-xl">

                          <div className="space-y-3">

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

                                  <span className="min-w-0 text-slate-400">
                                    {item.quantidade}
                                    x{" "}
                                    {item.nome}
                                  </span>

                                  <span className="shrink-0 font-bold text-slate-200">
                                    {formatarPreco(
                                      item.subtotal
                                    )}
                                  </span>

                                </div>
                              )
                            )}

                          </div>

                          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">

                            <div className="flex justify-between text-slate-400">

                              <span>
                                Produtos
                              </span>

                              <span>
                                {formatarPreco(
                                  pedido.subtotal
                                )}
                              </span>

                            </div>

                            <div className="flex justify-between text-slate-400">

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

                            <div className="flex justify-between border-t border-white/10 pt-3 text-sm font-black">

                              <span>
                                Total
                              </span>

                              <span className="text-sky-300">
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
                            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-sky-300/10 bg-sky-400/[0.07] text-xs font-black text-sky-200 backdrop-blur-xl"
                          >
                            <MapPin
                              size={15}
                            />

                            Abrir endereço no Maps
                          </a>
                        )}

                      {/* AÇÕES */}

                      <div className="mt-4 grid grid-cols-2 gap-2">

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
                            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-gradient-to-r from-sky-500 to-blue-600 px-3 text-xs font-black text-white shadow-[0_10px_30px_rgba(14,165,233,0.25)] transition active:scale-[0.98] disabled:opacity-50"
                          >

                            {pedido.status ===
                              "novo" && (
                              <>
                                <PackageCheck
                                  size={16}
                                />

                                Iniciar preparo
                              </>
                            )}

                            {pedido.status ===
                              "em_preparo" && (
                              <>
                                <Truck
                                  size={16}
                                />

                                Saiu para entrega
                              </>
                            )}

                            {pedido.status ===
                              "saiu_para_entrega" && (
                              <>
                                <CheckCircle2
                                  size={16}
                                />

                                Concluir
                              </>
                            )}

                          </button>
                        ) : (
                          <div
                            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black ${
                              pedido.status ===
                              "concluido"
                                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                                : "border-red-300/20 bg-red-400/10 text-red-300"
                            }`}
                          >

                            {pedido.status ===
                            "concluido" ? (
                              <>
                                <CheckCircle2
                                  size={16}
                                />

                                Concluído
                              </>
                            ) : (
                              <>
                                <XCircle
                                  size={16}
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
                              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/15 bg-red-500/10 px-3 text-xs font-black text-red-300 backdrop-blur-xl transition hover:bg-red-500/15 disabled:opacity-50"
                            >
                              <XCircle
                                size={16}
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