"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Copy,
  MapPin,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useCart,
} from "@/context/CartContext";

import {
  useStore,
} from "@/context/StoreContext";

import {
  gerarPix,
} from "@/lib/pix";

import {
  supabase,
} from "@/lib/supabase";

export default function PagamentoPage() {
  const {
    itens,
    valorTotal,
    dadosCheckout,
  } = useCart();

  const {
    loja,
  } = useStore();

  const router =
    useRouter();

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const [
    salvandoPedido,
    setSalvandoPedido,
  ] = useState(false);

  const taxaEntrega =
    dadosCheckout.tipoEntrega ===
    "entrega"
      ? dadosCheckout.taxaEntrega
      : 0;

  const total =
    valorTotal +
    taxaEntrega;

  const nomeLoja =
    loja?.nome ||
    "Sua loja";

  const chavePix =
    loja?.chave_pix ||
    "";

  const whatsappLoja = (
    loja?.whatsapp ||
    ""
  ).replace(
    /\D/g,
    ""
  );

  const formatarPreco = (
    valor: number
  ) =>
    valor.toLocaleString(
      "pt-BR",
      {
        style:
          "currency",

        currency:
          "BRL",
      }
    );

  const enderecoCliente =
    useMemo(() => {
      if (
        dadosCheckout.tipoEntrega !==
        "entrega"
      ) {
        return "";
      }

      return [
        dadosCheckout.rua,
        dadosCheckout.numero,
        dadosCheckout.bairro,
        loja?.cidade,
        loja?.estado,
      ]
        .filter(Boolean)
        .join(", ");
    }, [
      dadosCheckout,
      loja?.cidade,
      loja?.estado,
    ]);

  const linkMapsCliente =
    useMemo(() => {
      if (
        !enderecoCliente
      ) {
        return "";
      }

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        enderecoCliente
      )}`;
    }, [
      enderecoCliente,
    ]);

  const pixCopiaECola =
    useMemo(() => {
      if (
        !chavePix ||
        total <= 0
      ) {
        return "";
      }

      return gerarPix({
        chave:
          chavePix,

        nome:
          nomeLoja
            .toUpperCase()
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .slice(
              0,
              25
            ),

        cidade: (
          loja?.cidade ||
          "BRASIL"
        )
          .toUpperCase()
          .normalize(
            "NFD"
          )
          .replace(
            /[\u0300-\u036f]/g,
            ""
          )
          .slice(
            0,
            15
          ),

        valor:
          total,

        descricao:
          "PEDIDO CARDAPIO",
      });
    }, [
      chavePix,
      nomeLoja,
      loja?.cidade,
      total,
    ]);

  const copiarPix =
    async () => {
      if (
        !pixCopiaECola
      ) {
        alert(
          "A loja ainda não configurou uma chave Pix."
        );

        return;
      }

      try {
        await navigator.clipboard.writeText(
          pixCopiaECola
        );

        setCopiado(
          true
        );

        setTimeout(
          () => {
            setCopiado(
              false
            );
          },
          2000
        );
      } catch {
        alert(
          "Não foi possível copiar o código Pix."
        );
      }
    };

  const mensagemWhatsApp =
    useMemo(() => {
      const produtos =
        itens
          .map(
            (
              item
            ) =>
              `• ${item.quantidade}x ${item.nome}
  ${formatarPreco(
    item.preco *
      item.quantidade
  )}`
          )
          .join(
            "\n\n"
          );

      let recebimento =
        "";

      if (
        dadosCheckout.tipoEntrega ===
        "entrega"
      ) {
        recebimento = `🛵 *ENTREGA*

📍 ${dadosCheckout.rua}, ${dadosCheckout.numero}
${dadosCheckout.bairro}${
          dadosCheckout.complemento
            ? `\nComplemento: ${dadosCheckout.complemento}`
            : ""
        }

🗺️ Localização:
${linkMapsCliente}`;
      } else {
        recebimento = `🏪 *RETIRADA NO LOCAL*

${[
  loja?.endereco,
  loja?.numero,
  loja?.bairro,
  loja?.cidade,
  loja?.estado,
]
  .filter(Boolean)
  .join(", ")}`;
      }

      return `Olá! Gostaria de confirmar meu pedido na *${nomeLoja}*.

👤 *CLIENTE*
${dadosCheckout.clienteNome}

📱 ${dadosCheckout.clienteTelefone}

━━━━━━━━━━━━━━

🧾 *PEDIDO*

${produtos}

━━━━━━━━━━━━━━

${recebimento}

━━━━━━━━━━━━━━

💰 *RESUMO*

Subtotal: ${formatarPreco(
        valorTotal
      )}

${
  dadosCheckout.tipoEntrega ===
  "entrega"
    ? `Entrega: ${
        taxaEntrega ===
        0
          ? "Grátis"
          : formatarPreco(
              taxaEntrega
            )
      }`
    : "Retirada: Grátis"
}

*Total: ${formatarPreco(
        total
      )}*

💳 Pagamento: Pix

Pedido enviado pelo cardápio online.`;
    }, [
      itens,
      dadosCheckout,
      linkMapsCliente,
      loja,
      nomeLoja,
      valorTotal,
      taxaEntrega,
      total,
    ]);

  const linkWhatsApp =
    useMemo(() => {
      if (
        !whatsappLoja
      ) {
        return "";
      }

      return `https://wa.me/${whatsappLoja}?text=${encodeURIComponent(
        mensagemWhatsApp
      )}`;
    }, [
      whatsappLoja,
      mensagemWhatsApp,
    ]);

  const confirmarPedido =
    async () => {
      if (!loja) {
        alert(
          "Não foi possível identificar a loja."
        );

        return;
      }

      if (
        itens.length ===
        0
      ) {
        alert(
          "Seu carrinho está vazio."
        );

        return;
      }

      if (
        !dadosCheckout.clienteNome.trim()
      ) {
        alert(
          "Nome do cliente não informado."
        );

        return;
      }

      if (
        !dadosCheckout.clienteTelefone.trim()
      ) {
        alert(
          "Telefone do cliente não informado."
        );

        return;
      }

      if (
        !whatsappLoja
      ) {
        alert(
          "WhatsApp da loja não configurado."
        );

        return;
      }

      try {
        setSalvandoPedido(
          true
        );

        const {
          data:
            pedido,

          error:
            erroPedido,
        } =
          await supabase
            .from(
              "pedidos"
            )
            .insert({
              loja_id:
                loja.id,

              cliente_nome:
                dadosCheckout.clienteNome.trim(),

              cliente_telefone:
                dadosCheckout.clienteTelefone.trim(),

              status:
                "novo",

              tipo_entrega:
                dadosCheckout.tipoEntrega,

              forma_pagamento:
                "pix",

              subtotal:
                valorTotal,

              taxa_entrega:
                taxaEntrega,

              total,

              rua:
                dadosCheckout.tipoEntrega ===
                "entrega"
                  ? dadosCheckout.rua.trim()
                  : "",

              numero:
                dadosCheckout.tipoEntrega ===
                "entrega"
                  ? dadosCheckout.numero.trim()
                  : "",

              bairro:
                dadosCheckout.tipoEntrega ===
                "entrega"
                  ? dadosCheckout.bairro.trim()
                  : "",

              complemento:
                dadosCheckout.tipoEntrega ===
                "entrega"
                  ? dadosCheckout.complemento.trim()
                  : "",
            })
            .select(
              "id"
            )
            .single();

        if (
          erroPedido
        ) {
          throw erroPedido;
        }

        if (!pedido) {
          throw new Error(
            "Pedido não retornado."
          );
        }

        const itensPedido =
          itens.map(
            (
              item
            ) => ({
              pedido_id:
                pedido.id,

              produto_id:
                item.id,

              nome:
                item.nome,

              preco:
                item.preco,

              quantidade:
                item.quantidade,

              subtotal:
                item.preco *
                item.quantidade,
            })
          );

        const {
          error:
            erroItens,
        } =
          await supabase
            .from(
              "pedido_itens"
            )
            .insert(
              itensPedido
            );

        if (
          erroItens
        ) {
          throw erroItens;
        }

        window.open(
          linkWhatsApp,
          "_blank"
        );

        router.push(
          `/pedido/${pedido.id}`
        );
      } catch (
        error
      ) {
        console.error(
          "Erro ao salvar pedido:",
          error
        );

        alert(
          "Não foi possível salvar o pedido. Tente novamente."
        );
      } finally {
        setSalvandoPedido(
          false
        );
      }
    };

  if (
    itens.length ===
    0
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
          <ShoppingBag
            size={36}
            className="mx-auto text-zinc-300"
          />

          <h1 className="mt-4 text-xl font-bold">
            Seu pedido está vazio
          </h1>

          <Link
            href="/menu"
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 font-bold text-white"
          >
            Voltar ao cardápio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-32 text-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/checkout"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div>
            <p className="text-xs text-zinc-500">
              {nomeLoja}
            </p>

            <h1 className="text-lg font-extrabold">
              Pagamento
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Total do pedido
          </p>

          <h2 className="mt-1 text-3xl font-extrabold">
            {formatarPreco(
              total
            )}
          </h2>

          {pixCopiaECola ? (
            <>
              <div className="mx-auto mt-4 flex w-fit rounded-3xl bg-white p-2 ring-1 ring-zinc-100">
                <QRCodeSVG
                  value={
                    pixCopiaECola
                  }
                  size={
                    190
                  }
                  level="M"
                  includeMargin
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Escaneie o QR Code com o aplicativo do seu banco.
              </p>

              <button
                type="button"
                onClick={
                  copiarPix
                }
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 text-sm font-bold text-white"
              >
                {copiado ? (
                  <>
                    <Check
                      size={
                        17
                      }
                    />

                    Código copiado
                  </>
                ) : (
                  <>
                    <Copy
                      size={
                        17
                      }
                    />

                    Copiar Pix copia e cola
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Pix não configurado
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="font-extrabold">
            Resumo do pedido
          </h2>

          <div className="mt-4 space-y-3">
            {itens.map(
              (
                item
              ) => (
                <div
                  key={
                    item.id
                  }
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-600">
                    {
                      item.quantidade
                    }
                    x{" "}
                    {
                      item.nome
                    }
                  </span>

                  <span className="font-semibold">
                    {formatarPreco(
                      item.preco *
                        item.quantidade
                    )}
                  </span>
                </div>
              )
            )}

            <div className="border-t border-zinc-100 pt-3">
              <div className="flex justify-between font-bold">
                <span>
                  Total
                </span>

                <span className="text-xl">
                  {formatarPreco(
                    total
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Cliente
          </p>

          <p className="mt-1 font-bold">
            {
              dadosCheckout.clienteNome
            }
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {
              dadosCheckout.clienteTelefone
            }
          </p>
        </section>

        {dadosCheckout.tipoEntrega ===
          "entrega" && (
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <MapPin
                size={18}
              />

              <div>
                <h2 className="text-sm font-extrabold">
                  Endereço
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {
                    dadosCheckout.rua
                  }
                  ,{" "}
                  {
                    dadosCheckout.numero
                  }

                  <br />

                  {
                    dadosCheckout.bairro
                  }

                  {dadosCheckout.complemento && (
                    <>
                      <br />

                      Complemento:{" "}
                      {
                        dadosCheckout.complemento
                      }
                    </>
                  )}
                </p>
              </div>
            </div>
          </section>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white/95 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
        <button
          type="button"
          onClick={
            confirmarPedido
          }
          disabled={
            salvandoPedido ||
            !linkWhatsApp
          }
          className="mx-auto flex h-16 w-full max-w-md items-center justify-between rounded-2xl bg-green-600 px-5 text-white shadow-xl disabled:bg-zinc-300"
        >
          <div className="flex items-center gap-3">
            <MessageCircle
              size={20}
            />

            <div className="text-left">
              <p className="text-[11px] opacity-80">
                {salvandoPedido
                  ? "Registrando..."
                  : "Enviar para a loja"}
              </p>

              <p className="text-[15px] font-extrabold">
                {salvandoPedido
                  ? "Aguarde"
                  : "Confirmar pedido"}
              </p>
            </div>
          </div>

          <span className="font-extrabold">
            {formatarPreco(
              total
            )}
          </span>
        </button>
      </div>
    </main>
  );
}