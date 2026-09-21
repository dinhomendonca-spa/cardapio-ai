"use client";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  Building2,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  Hourglass,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Settings,
  Smartphone,
  Store,
  Sparkles,
  UserRoundCog,
} from "lucide-react";

import {
  useStore,
} from "@/context/StoreContext";

import {
  useAuth,
} from "@/context/AuthContext";

type RespostaStatus = {
  status: string;
  ativo: boolean;

  tipoAcesso?:
    | "VITALICIO"
    | "TESTE_GRATIS"
    | "ASSINATURA"
    | "SEM_ACESSO";

  testeGratis?: boolean;
  testeInicio?: string | null;
  testeFim?: string | null;
  diasRestantesTeste?: number;

  fimPeriodo?: string | null;
  fim_periodo?: string | null;
  diasRestantes?: number;
  diasRestantesAssinatura?: number;

  erro?: string;
};

const itens = [
  {
    titulo:
      "Dados da loja",

    descricao:
      "Nome, logo, banner e endereço",

    icone:
      Building2,

    href:
      "/admin/loja",
  },

  {
    titulo:
      "Produtos",

    descricao:
      "Cadastrar e editar produtos",

    icone:
      Package,

    href:
      "/admin/produtos",
  },

  {
    titulo:
      "Pedidos",

    descricao:
      "Visualizar pedidos recebidos",

    icone:
      LayoutDashboard,

    href:
      "/admin/pedidos",
  },

  {
    titulo:
      "QR Code",

    descricao:
      "Compartilhe sua loja com seus clientes",

    icone:
      QrCode,

    href:
      "/admin/qrcode",
  },

  {
    titulo:
      "Pagamento",

    descricao:
      "Chave Pix e configurações",

    icone:
      CreditCard,

    href:
      "/admin/pagamento",
  },

  {
    titulo:
      "Horários",

    descricao:
      "Definir abertura e fechamento da loja",

    icone:
      Clock3,

    href:
      "/admin/horarios",
  },

  {
    titulo:
      "Entrega",

    descricao:
      "Taxa, retirada e regiões atendidas",

    icone:
      Smartphone,

    href:
      "/admin/entrega",
  },

  {
    titulo:
      "Minha conta",

    descricao:
      "Alterar e-mail e senha de acesso",

    icone:
      UserRoundCog,

    href:
      "/admin/conta",
  },

  {
    titulo:
      "Configurações",

    descricao:
      "WhatsApp e preferências da loja",

    icone:
      Settings,

    href:
      "/admin/configuracoes",
  },
];

export default function AdminPage() {
  const router =
    useRouter();

  const {
    loja,
    carregando,
  } =
    useStore();

  const {
    session,
    sair,
  } =
    useAuth();

  const [
    saindo,
    setSaindo,
  ] =
    useState(false);

  const [
    statusAcesso,
    setStatusAcesso,
  ] =
    useState<RespostaStatus | null>(
      null
    );

  const [
    carregandoStatus,
    setCarregandoStatus,
  ] =
    useState(false);

  useEffect(() => {
    const token =
      session?.access_token;

    if (!token) {
      return;
    }

    let ativo =
      true;

    const carregarStatus =
      async () => {
        try {
          setCarregandoStatus(
            true
          );

          const resposta =
            await fetch(
              "/api/assinatura/status",
              {
                method:
                  "GET",

                headers: {
                  authorization:
                    `Bearer ${token}`,
                },

                cache:
                  "no-store",
              }
            );

          const resultado =
            (await resposta.json()) as
              RespostaStatus;

          if (
            !resposta.ok
          ) {
            throw new Error(
              resultado.erro ||
                "Não foi possível consultar seu acesso."
            );
          }

          if (!ativo) {
            return;
          }

          setStatusAcesso(
            resultado
          );
        } catch (error) {
          console.error(
            "Erro ao consultar status:",
            error
          );

          if (ativo) {
            setStatusAcesso(
              null
            );
          }
        } finally {
          if (ativo) {
            setCarregandoStatus(
              false
            );
          }
        }
      };

    carregarStatus();

    return () => {
      ativo =
        false;
    };
  }, [
    session?.access_token,
  ]);

  const handleSair =
    async () => {
      if (saindo) {
        return;
      }

      try {
        setSaindo(true);

        await sair();

        router.replace(
          "/login"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Erro ao sair:",
          error
        );

        alert(
          "Não foi possível sair da conta. Tente novamente."
        );
      } finally {
        setSaindo(false);
      }
    };

  const estaEmTeste =
    statusAcesso
      ?.tipoAcesso ===
      "TESTE_GRATIS" &&
    statusAcesso
      ?.testeGratis ===
      true;

  const diasRestantes =
    statusAcesso
      ?.diasRestantesTeste ??
    0;

  const fimPeriodoAssinatura =
    statusAcesso?.fimPeriodo ??
    statusAcesso?.fim_periodo ??
    null;

  const diasCalculadosAssinatura =
    fimPeriodoAssinatura
      ? Math.max(
          0,
          Math.ceil(
            (new Date(
              fimPeriodoAssinatura
            ).getTime() -
              Date.now()) /
              (24 *
                60 *
                60 *
                1000)
          )
        )
      : null;

  const diasRestantesAssinatura =
    statusAcesso
      ?.diasRestantesAssinatura ??
    statusAcesso
      ?.diasRestantes ??
    diasCalculadosAssinatura;

  const estaEmAssinatura =
    statusAcesso
      ?.tipoAcesso ===
    "ASSINATURA";

  const podeRenovar =
    estaEmAssinatura &&
    diasRestantesAssinatura !==
      null &&
    diasRestantesAssinatura >=
      0 &&
    diasRestantesAssinatura <=
      7;

  const acessoExpirado =
    statusAcesso !== null &&
    !statusAcesso.ativo &&
    statusAcesso.tipoAcesso !==
      "VITALICIO";

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sky-300/20 border-t-sky-400" />

          <p className="mt-4 text-sm text-slate-400">
            Carregando painel...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b18] text-white">
      {/* Fundo decorativo */}

      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-44 top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />

      <div className="relative z-10">
        <header className="px-4 pb-8 pt-6">
          <div className="mx-auto max-w-md">
            {/* Marca */}

            <div className="mb-5 flex items-center justify-between rounded-[28px] border border-sky-300/15 bg-white/[0.06] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/25 bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_8px_30px_rgba(14,165,233,0.35)]">
                  <Store
                    size={22}
                    className="text-white"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-300">
                    LOJAI
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-white">
                    Painel do comerciante
                  </p>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-300/15 bg-white/[0.05] text-sky-300 backdrop-blur-xl">
                <Sparkles
                  size={18}
                />
              </div>
            </div>

            {/* Nome da loja */}

            <div className="px-1">
              <p className="text-sm text-slate-400">
                Bem-vindo ao painel
              </p>

              <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-white">
                {loja?.nome ||
                  "Sua loja"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Gerencie sua loja,
                produtos e pedidos em
                um só lugar.
              </p>
            </div>

            {/* Status */}

            <div className="mt-6 rounded-[28px] border border-sky-300/15 bg-white/[0.06] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Status do sistema
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        loja?.ativo
                          ? "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.9)]"
                          : "bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.8)]"
                      }`}
                    />

                    <span className="font-bold text-white">
                      {loja?.ativo
                        ? "Loja online"
                        : "Loja desativada"}
                    </span>
                  </div>

                  {estaEmTeste && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2">
                      <Hourglass
                        size={15}
                        className="text-amber-300"
                      />

                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-amber-200">
                          {
                            diasRestantes
                          }
                        </span>

                        <span className="text-[11px] font-semibold text-amber-100/80">
                          {diasRestantes ===
                          1
                            ? "dia restante"
                            : "dias restantes"}
                        </span>
                      </div>
                    </div>
                  )}

                  {estaEmAssinatura &&
                    diasRestantesAssinatura !==
                      null && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-2">
                        <Hourglass
                          size={15}
                          className="text-sky-300"
                        />

                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-sky-200">
                            {
                              diasRestantesAssinatura
                            }
                          </span>

                          <span className="text-[11px] font-semibold text-sky-100/80">
                            {diasRestantesAssinatura ===
                            1
                              ? "dia restante"
                              : "dias restantes"}
                          </span>
                        </div>
                      </div>
                    )}

                  {carregandoStatus && (
                    <p className="mt-3 text-[11px] text-slate-500">
                      Verificando
                      período de
                      acesso...
                    </p>
                  )}
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
                  <Store
                    size={21}
                  />
                </div>
              </div>
            </div>

            {(podeRenovar ||
              acessoExpirado ||
              (estaEmTeste &&
                diasRestantes <=
                  7)) && (
              <div className="mt-3 rounded-[24px] border border-amber-300/25 bg-amber-400/10 p-4 shadow-[0_12px_40px_rgba(251,191,36,0.10)] backdrop-blur-xl">
                <p className="text-sm font-bold text-amber-100">
                  {acessoExpirado
                    ? "Seu acesso expirou. Faça a renovação para reativar sua loja."
                    : podeRenovar
                      ? diasRestantesAssinatura ===
                        1
                        ? "Seu acesso expira amanhã. Renove agora sem perder o dia restante."
                        : `Faltam ${diasRestantesAssinatura} dias para o vencimento. Renove agora sem perder os dias restantes.`
                      : "Seu período de teste está terminando. Escolha um plano para continuar."}
                </p>

                <Link
                  href="/assinar"
                  className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-sm font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-[0.98]"
                >
                  <CreditCard
                    size={17}
                  />

                  {estaEmTeste &&
                  !acessoExpirado
                    ? "Ver planos"
                    : "Renovar agora"}
                </Link>
              </div>
            )}

            {/* Acesso à loja */}

            {loja?.slug && (
              <Link
                href={`/loja/${loja.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-[22px] border border-sky-300/25 bg-gradient-to-r from-sky-500/20 to-blue-600/20 px-5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(14,165,233,0.15)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/40 hover:from-sky-500/30 hover:to-blue-600/30 active:scale-[0.98]"
              >
                <ExternalLink
                  size={17}
                />

                Ver minha loja
              </Link>
            )}
          </div>
        </header>

        {/* Menu */}

        <section className="mx-auto max-w-md px-4 pb-12">
          <div className="mb-4 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Gerenciamento
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              Sua operação
            </h2>
          </div>

          <div className="rounded-[32px] border border-sky-300/15 bg-white/[0.045] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
            <div className="grid gap-3">
              {itens.map(
                ({
                  titulo,
                  descricao,
                  icone:
                    Icon,
                  href,
                }) => (
                  <Link
                    key={
                      href
                    }
                    href={
                      href
                    }
                    className="group flex items-center gap-4 rounded-[24px] border border-white/[0.07] bg-gradient-to-r from-white/[0.07] to-white/[0.03] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/25 hover:from-sky-400/10 hover:to-blue-500/10 active:scale-[0.985]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-gradient-to-br from-sky-400/20 to-blue-600/15 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition group-hover:border-sky-300/35 group-hover:text-sky-200">
                      <Icon
                        size={
                          21
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-white">
                        {
                          titulo
                        }
                      </h2>

                      <p className="mt-0.5 text-sm leading-5 text-slate-400">
                        {
                          descricao
                        }
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-slate-500 transition group-hover:border-sky-300/20 group-hover:bg-sky-400/10 group-hover:text-sky-300">
                      <ChevronRight
                        size={
                          18
                        }
                      />
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={
              handleSair
            }
            disabled={
              saindo
            }
            className="mt-4 flex w-full items-center gap-4 rounded-[24px] border border-red-400/20 bg-red-500/[0.07] p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-red-400/35 hover:bg-red-500/[0.12] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300">
              {saindo ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
              ) : (
                <LogOut
                  size={21}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-red-200">
                {saindo
                  ? "Saindo..."
                  : "Sair"}
              </h2>

              <p className="mt-0.5 text-sm leading-5 text-slate-400">
                Encerrar sua sessão
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/10 bg-red-500/[0.05] text-red-300">
              <ChevronRight
                size={18}
              />
            </div>
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              LOJAI • Sua loja,
              sem limites
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
