"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Rocket,
  Store,
  Truck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useStore,
} from "@/context/StoreContext";

import {
  supabase,
} from "@/lib/supabase";

type ItemRevisao = {
  titulo: string;
  descricao: string;
  concluido: boolean;
  href: string;
  icone: typeof Store;
};

function imagemEhPadrao(
  url: string,
  arquivoPadrao: string
) {
  if (!url) {
    return true;
  }

  return url.endsWith(
    arquivoPadrao
  );
}

export default function PublicarLojaPage() {
  const {
    loja,
    carregando,
    salvarLoja,
  } = useStore();

  const [
    quantidadeProdutos,
    setQuantidadeProdutos,
  ] = useState(0);

  const [
    carregandoProdutos,
    setCarregandoProdutos,
  ] = useState(true);

  const [
    publicando,
    setPublicando,
  ] = useState(false);

  const [
    publicada,
    setPublicada,
  ] = useState(false);

  const [
    linkCopiado,
    setLinkCopiado,
  ] = useState(false);

  const carregarProdutos =
    useCallback(
      async () => {
        if (!loja?.id) {
          setQuantidadeProdutos(
            0
          );

          setCarregandoProdutos(
            false
          );

          return;
        }

        try {
          setCarregandoProdutos(
            true
          );

          const {
            count,
            error,
          } =
            await supabase
              .from("produtos")
              .select(
                "id",
                {
                  count:
                    "exact",

                  head:
                    true,
                }
              )
              .eq(
                "loja_id",
                loja.id
              )
              .eq(
                "ativo",
                true
              );

          if (error) {
            throw error;
          }

          setQuantidadeProdutos(
            count ?? 0
          );
        } catch (error) {
          console.error(
            "Erro ao contar produtos:",
            error
          );

          setQuantidadeProdutos(
            0
          );
        } finally {
          setCarregandoProdutos(
            false
          );
        }
      },
      [
        loja?.id,
      ]
    );

  useEffect(() => {
    carregarProdutos();
  }, [
    carregarProdutos,
  ]);

  useEffect(() => {
    if (
      loja?.configuracao_concluida
    ) {
      setPublicada(true);
    }
  }, [
    loja?.configuracao_concluida,
  ]);

  const identidadeConcluida =
    Boolean(
      loja &&
      loja.nome.trim().length >= 2 &&
      loja.nome
        .trim()
        .toLowerCase() !==
        "minha loja" &&
      loja.descricao.trim().length >= 10 &&
      loja.logo &&
      !imagemEhPadrao(
        loja.logo,
        "/images/logo.png"
      ) &&
      loja.banner &&
      !imagemEhPadrao(
        loja.banner,
        "/images/banner.png"
      )
    );

  const contatoConcluido =
    Boolean(
      loja &&
      loja.whatsapp
        .replace(/\D/g, "")
        .length >= 10
    );

  const pagamentoConcluido =
    Boolean(
      loja &&
      (
        loja.aceita_pix ||
        loja.aceita_cartao
      ) &&
      (
        !loja.aceita_pix ||
        loja.chave_pix.trim()
      )
    );

  const entregaConcluida =
    Boolean(
      loja &&
      (
        loja.entrega_ativa ||
        loja.retirada_permitida
      ) &&
      loja.endereco.trim() &&
      loja.numero.trim() &&
      loja.bairro.trim() &&
      loja.cidade.trim() &&
      loja.estado.trim().length === 2 &&
      loja.cep
        .replace(/\D/g, "")
        .length === 8
    );

  const produtosConcluidos =
    quantidadeProdutos > 0;

  const itens: ItemRevisao[] = [
    {
      titulo:
        "Identidade e imagens",

      descricao:
        identidadeConcluida
          ? "Nome, descrição, logotipo e capa configurados"
          : "Complete o nome, descrição, logotipo e capa",

      concluido:
        identidadeConcluida,

      href:
        "/admin/loja",

      icone:
        ImageIcon,
    },

    {
      titulo:
        "Contato e pagamento",

      descricao:
        contatoConcluido &&
        pagamentoConcluido
          ? "WhatsApp e forma de pagamento configurados"
          : "Configure o WhatsApp e uma forma de pagamento",

      concluido:
        contatoConcluido &&
        pagamentoConcluido,

      href:
        "/admin/loja",

      icone:
        MessageCircle,
    },

    {
      titulo:
        "Entrega e retirada",

      descricao:
        entregaConcluida
          ? "Modalidades e endereço configurados"
          : "Complete as modalidades e o endereço",

      concluido:
        entregaConcluida,

      href:
        "/admin/entrega",

      icone:
        Truck,
    },

    {
      titulo:
        "Produtos",

      descricao:
        produtosConcluidos
          ? `${quantidadeProdutos} ${
              quantidadeProdutos === 1
                ? "produto ativo"
                : "produtos ativos"
            }`
          : "Cadastre pelo menos um produto ativo",

      concluido:
        produtosConcluidos,

      href:
        "/admin/produtos/novo",

      icone:
        Package,
    },
  ];

  const itensConcluidos =
    itens.filter(
      (item) =>
        item.concluido
    ).length;

  const prontaParaPublicar =
    itensConcluidos ===
      itens.length &&
    !carregandoProdutos;

  const publicar =
    async () => {
      if (
        !loja ||
        !prontaParaPublicar
      ) {
        alert(
          "Conclua todos os itens antes de publicar."
        );

        return;
      }

      if (
        loja.bloqueada_por_assinatura
      ) {
        alert(
          "A assinatura precisa estar ativa para publicar a loja."
        );

        return;
      }

      try {
        setPublicando(true);

        await salvarLoja({
          ativo:
            true,

          configuracao_concluida:
            true,
        });

        setPublicada(true);
      } catch (error) {
        console.error(
          "Erro ao publicar loja:",
          error
        );

        alert(
          "Não foi possível publicar a loja."
        );
      } finally {
        setPublicando(false);
      }
    };

  const urlPublica =
    loja?.slug
      ? `${window.location.origin}/loja/${loja.slug}`
      : "";

  const copiarLink =
    async () => {
      if (!urlPublica) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          urlPublica
        );

        setLinkCopiado(true);

        window.setTimeout(
          () =>
            setLinkCopiado(
              false
            ),
          2500
        );
      } catch {
        alert(
          "Não foi possível copiar o link."
        );
      }
    };

  if (
    carregando ||
    carregandoProdutos
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18]">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-3 text-sm text-slate-400">
            Revisando sua loja...
          </p>
        </div>
      </main>
    );
  }

  if (!loja) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 text-white">
        <section className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-center">
          <Store
            size={30}
            className="mx-auto text-slate-500"
          />

          <h1 className="mt-4 text-xl font-black">
            Loja não encontrada
          </h1>

          <Link
            href="/admin"
            className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-sky-500 font-bold"
          >
            Voltar ao painel
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] pb-12 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020b18]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">
          <Link
            href="/admin/produtos"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
              Configuração inicial
            </p>

            <h1 className="truncate text-lg font-black">
              Revisar e publicar
            </h1>
          </div>

          <div className="ml-auto rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300">
            4 de 4
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">
        {publicada ? (
          <section className="overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-400/20 to-cyan-500/10 p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <Rocket
                size={34}
              />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Loja publicada
            </p>

            <h1 className="mt-2 text-2xl font-black">
              Sua loja está online!
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Compartilhe o link com seus clientes e comece a receber pedidos.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="break-all text-xs leading-5 text-slate-300">
                {urlPublica}
              </p>
            </div>

            <button
              type="button"
              onClick={
                copiarLink
              }
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-bold text-slate-950"
            >
              <Copy
                size={18}
              />

              {linkCopiado
                ? "Link copiado!"
                : "Copiar link"}
            </button>

            <Link
              href={`/loja/${loja.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-bold"
            >
              <ExternalLink
                size={18}
              />

              Abrir minha loja
            </Link>

            <Link
              href="/admin"
              className="mt-3 flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] font-bold"
            >
              Ir para o painel
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-500/20 to-blue-600/10 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500">
                  <Rocket
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="font-black">
                    Está quase pronto
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Revise os itens abaixo antes de abrir sua loja para os clientes.
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
                  style={{
                    width:
                      `${itensConcluidos * 25}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs font-semibold text-sky-200">
                {itensConcluidos} de 4 etapas concluídas
              </p>
            </section>

            <section className="space-y-3">
              {itens.map(
                (
                  item
                ) => {
                  const Icone =
                    item.icone;

                  return (
                    <Link
                      key={
                        item.titulo
                      }
                      href={
                        item.href
                      }
                      className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.06] p-4"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          item.concluido
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-amber-400/15 text-amber-300"
                        }`}
                      >
                        <Icone
                          size={21}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold">
                            {item.titulo}
                          </h2>

                          {item.concluido ? (
                            <Check
                              size={17}
                              className="text-emerald-400"
                            />
                          ) : (
                            <Circle
                              size={16}
                              className="text-amber-400"
                            />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {item.descricao}
                        </p>
                      </div>

                      <ChevronRight
                        size={19}
                        className="shrink-0 text-slate-500"
                      />
                    </Link>
                  );
                }
              )}
            </section>

            <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={19}
                  className="mt-0.5 shrink-0 text-sky-300"
                />

                <div>
                  <p className="font-bold">
                    Antes de publicar
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Abra a loja depois da publicação e confira imagens, preços, endereço e formas de pagamento.
                  </p>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={
                publicar
              }
              disabled={
                publicando ||
                !prontaParaPublicar
              }
              className="flex h-16 w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 font-black shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {publicando ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Publicando...
                </>
              ) : (
                <>
                  <Rocket
                    size={21}
                  />

                  Publicar minha loja
                </>
              )}
            </button>

            {!prontaParaPublicar && (
              <p className="text-center text-xs leading-5 text-slate-500">
                Conclua os itens pendentes para liberar a publicação.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}