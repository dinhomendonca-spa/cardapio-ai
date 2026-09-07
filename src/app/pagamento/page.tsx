"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  MapPin,
  MessageCircle,
  QrCode,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

import {
  QRCodeSVG,
} from "qrcode.react";

import {
  useEffect,
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

type FormaPagamento =
  | "pix"
  | "cartao";

function normalizarWhatsApp(
  telefone: string
) {
  let numeros =
    telefone.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length === 10 ||
    numeros.length === 11
  ) {
    numeros =
      `55${numeros}`;
  }

  return numeros;
}

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

  const [
    formaPagamento,
    setFormaPagamento,
  ] =
    useState<FormaPagamento>(
      "pix"
    );

  /*
   * ==========================================
   * FORMAS DE PAGAMENTO DISPONÍVEIS
   * ==========================================
   */

  const pixDisponivel =
    loja?.aceita_pix !==
      false &&
    Boolean(
      loja?.chave_pix
    );

  const cartaoDisponivel =
    Boolean(
      loja?.aceita_cartao
    ) &&
    Boolean(
      loja?.mercado_pago_conectado
    );

  /*
   * Se Pix estiver desativado
   * e cartão estiver disponível,
   * selecionamos cartão automaticamente.
   */

  useEffect(() => {
    if (
      !pixDisponivel &&
      cartaoDisponivel
    ) {
      setFormaPagamento(
        "cartao"
      );

      return;
    }

    if (
      pixDisponivel &&
      !cartaoDisponivel
    ) {
      setFormaPagamento(
        "pix"
      );
    }
  }, [
    pixDisponivel,
    cartaoDisponivel,
  ]);

  /*
   * ==========================================
   * ENTREGA
   * ==========================================
   */

  const taxaACombinar =
    dadosCheckout.tipoEntrega ===
      "entrega" &&
    (
      loja?.taxa_entrega_a_combinar ??
      false
    );

  const taxaEntrega =
    dadosCheckout.tipoEntrega ===
      "entrega" &&
    !taxaACombinar
      ? dadosCheckout.taxaEntrega
      : 0;

  const total =
    valorTotal +
    taxaEntrega;

  /*
   * ==========================================
   * LOJA
   * ==========================================
   */

  const nomeLoja =
    loja?.nome ||
    "Sua loja";

  const chavePix =
    loja?.chave_pix ||
    "";

  const whatsappLoja =
    normalizarWhatsApp(
      loja?.whatsapp ||
        ""
    );

  /*
   * ==========================================
   * FORMATAR PREÇO
   * ==========================================
   */

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

  /*
   * ==========================================
   * ENDEREÇO
   * ==========================================
   */

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

  /*
   * ==========================================
   * PIX
   * ==========================================
   */

  const pixCopiaECola =
    useMemo(() => {
      if (
        !pixDisponivel ||
        !chavePix ||
        total <= 0
      ) {
        return "";
      }

      try {
        return gerarPix({
          chave:
            chavePix,

          nome:
            nomeLoja
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
            "PEDIDO ONLINE",
        });
      } catch (
        error
      ) {
        console.error(
          "Erro ao gerar Pix:",
          error
        );

        return "";
      }
    }, [
      pixDisponivel,
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
          "A loja ainda não configurou uma chave Pix válida."
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

  /*
   * ==========================================
   * MENSAGEM WHATSAPP
   * ==========================================
   */

  const criarMensagemWhatsApp = (
    pedidoId: number
  ) => {
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

    const textoEntrega =
      dadosCheckout.tipoEntrega ===
      "entrega"
        ? taxaACombinar
          ? "Entrega: A combinar"
          : taxaEntrega === 0
            ? "Entrega: Grátis"
            : `Entrega: ${formatarPreco(
                taxaEntrega
              )}`
        : "Retirada: Grátis";

    const avisoTaxa =
      taxaACombinar
        ? "\n\n⚠️ A taxa de entrega será combinada com a loja."
        : "";

    const textoPagamento =
      formaPagamento ===
      "cartao"
        ? "Cartão de crédito"
        : "Pix";

    return `Olá! Gostaria de confirmar meu pedido na *${nomeLoja}*.

🧾 *PEDIDO #${pedidoId}*

👤 *CLIENTE*
${dadosCheckout.clienteNome}

📱 ${dadosCheckout.clienteTelefone}

━━━━━━━━━━━━━━

${produtos}

━━━━━━━━━━━━━━

${recebimento}

━━━━━━━━━━━━━━

💰 *RESUMO*

Subtotal: ${formatarPreco(
      valorTotal
    )}

${textoEntrega}

*Total: ${formatarPreco(
      total
    )}*${avisoTaxa}

💳 Pagamento: ${textoPagamento}

✅ Pedido enviado para confirmação.`;
  };

  /*
   * ==========================================
   * CONFIRMAR PEDIDO
   * ==========================================
   */

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
          "Informe o nome do cliente."
        );

        return;
      }

      if (
        !dadosCheckout.clienteTelefone.trim()
      ) {
        alert(
          "Informe o telefone do cliente."
        );

        return;
      }

      /*
       * ======================================
       * CARTÃO
       * ======================================
       */

      if (
        formaPagamento ===
        "cartao"
      ) {
        alert(
          "O cartão está habilitado nesta loja. Agora falta conectar a cobrança segura do Mercado Pago, que será o próximo passo."
        );

        return;
      }

      /*
       * ======================================
       * PIX
       * ======================================
       */

      if (
        formaPagamento ===
          "pix" &&
        !pixDisponivel
      ) {
        alert(
          "Pix não está disponível nesta loja."
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

      const janelaWhatsApp =
        window.open(
          "",
          "_blank"
        );

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
                formaPagamento,

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

        if (
          !pedido
        ) {
          throw new Error(
            "Pedido não retornado pelo banco."
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

        const mensagem =
          criarMensagemWhatsApp(
            Number(
              pedido.id
            )
          );

        const linkWhatsApp =
          `https://wa.me/${whatsappLoja}?text=${encodeURIComponent(
            mensagem
          )}`;

        if (
          janelaWhatsApp
        ) {
          janelaWhatsApp.location.href =
            linkWhatsApp;
        } else {
          window.location.href =
            linkWhatsApp;

          return;
        }

        router.push(
          `/loja/${loja.slug}/pedido/${pedido.id}`
        );
      } catch (
        error
      ) {
        console.error(
          "Erro ao confirmar pedido:",
          error
        );

        if (
          janelaWhatsApp &&
          !janelaWhatsApp.closed
        ) {
          janelaWhatsApp.close();
        }

        alert(
          "Não foi possível registrar o pedido. Tente novamente."
        );
      } finally {
        setSalvandoPedido(
          false
        );
      }
    };

  /*
   * ==========================================
   * CARRINHO VAZIO
   * ==========================================
   */

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
            href={`/loja/${loja?.slug}`}
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 font-bold text-white"
          >
            Voltar para a loja
          </Link>

        </div>

      </main>
    );
  }

  /*
   * ==========================================
   * TELA
   * ==========================================
   */

  return (
    <main className="min-h-screen bg-zinc-100 pb-32 text-zinc-950">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">

          <Link
            href={`/loja/${loja?.slug}/checkout`}
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

        {/* TOTAL */}

        <section className="rounded-3xl bg-white p-5 text-center shadow-sm">

          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Total do pedido
          </p>

          <h2 className="mt-1 text-3xl font-extrabold">
            {formatarPreco(
              total
            )}
          </h2>

          {taxaACombinar && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              + taxa de entrega a combinar
            </p>
          )}

        </section>

        {/* FORMA DE PAGAMENTO */}

        <section className="rounded-3xl bg-white p-4 shadow-sm">

          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Forma de pagamento
          </p>

          <h2 className="mt-1 font-extrabold">
            Como você deseja pagar?
          </h2>

          <div className="mt-4 space-y-2">

            {/* PIX */}

            {pixDisponivel && (
              <button
                type="button"
                onClick={() =>
                  setFormaPagamento(
                    "pix"
                  )
                }
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  formaPagamento ===
                  "pix"
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 bg-white"
                }`}
              >

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    formaPagamento ===
                    "pix"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <QrCode
                    size={20}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="font-extrabold">
                    Pix
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Pagamento rápido via QR Code
                  </p>

                </div>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    formaPagamento ===
                    "pix"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-300"
                  }`}
                >
                  {formaPagamento ===
                    "pix" && (
                    <Check
                      size={14}
                    />
                  )}
                </div>

              </button>
            )}

            {/* CARTÃO */}

            {cartaoDisponivel && (
              <button
                type="button"
                onClick={() =>
                  setFormaPagamento(
                    "cartao"
                  )
                }
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  formaPagamento ===
                  "cartao"
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 bg-white"
                }`}
              >

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    formaPagamento ===
                    "cartao"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <CreditCard
                    size={20}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">

                    <p className="font-extrabold">
                      Cartão de crédito
                    </p>

                    <ShieldCheck
                      size={15}
                      className="text-green-600"
                    />

                  </div>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Pagamento seguro pelo Mercado Pago
                  </p>

                </div>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    formaPagamento ===
                    "cartao"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-300"
                  }`}
                >
                  {formaPagamento ===
                    "cartao" && (
                    <Check
                      size={14}
                    />
                  )}
                </div>

              </button>
            )}

            {!pixDisponivel &&
              !cartaoDisponivel && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                Esta loja ainda não possui uma forma de pagamento disponível.
              </div>
            )}

          </div>

        </section>

        {/* PIX SELECIONADO */}

        {formaPagamento ===
          "pix" &&
          pixDisponivel && (
          <section className="rounded-3xl bg-white p-5 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

              <QrCode
                size={22}
              />

            </div>

            <h2 className="mt-3 font-extrabold">
              Pagamento por Pix
            </h2>

            {pixCopiaECola ? (
              <>

                <div className="mx-auto mt-4 flex w-fit rounded-3xl bg-white p-2 ring-1 ring-zinc-100">

                  <QRCodeSVG
                    value={
                      pixCopiaECola
                    }
                    size={190}
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
                        size={17}
                      />

                      Código copiado
                    </>
                  ) : (
                    <>
                      <Copy
                        size={17}
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
        )}

        {/* CARTÃO SELECIONADO */}

        {formaPagamento ===
          "cartao" &&
          cartaoDisponivel && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                <CreditCard
                  size={22}
                />

              </div>

              <div>

                <h2 className="font-extrabold">
                  Cartão de crédito
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  O pagamento será processado com segurança pelo Mercado Pago.
                </p>

              </div>

            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-4">

              <div className="flex gap-2">

                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>

                  <p className="text-sm font-bold text-blue-900">
                    Pagamento protegido
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Os dados do cartão não serão armazenados pelo Lojas AI.
                  </p>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* RESUMO */}

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
                    {item.quantidade}x{" "}
                    {item.nome}
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

              <div className="flex justify-between text-sm text-zinc-500">

                <span>
                  {dadosCheckout.tipoEntrega ===
                  "entrega"
                    ? "Entrega"
                    : "Retirada"}
                </span>

                <span>
                  {dadosCheckout.tipoEntrega ===
                  "retirada"
                    ? "Grátis"
                    : taxaACombinar
                      ? "A combinar"
                      : taxaEntrega === 0
                        ? "Grátis"
                        : formatarPreco(
                            taxaEntrega
                          )}
                </span>

              </div>

              <div className="mt-3 flex justify-between font-bold">

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

        {/* CLIENTE */}

        <section className="rounded-3xl bg-white p-4 shadow-sm">

          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Cliente
          </p>

          <p className="mt-1 font-bold">
            {dadosCheckout.clienteNome}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {dadosCheckout.clienteTelefone}
          </p>

        </section>

        {/* ENDEREÇO */}

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
                  {dadosCheckout.rua},{" "}
                  {dadosCheckout.numero}

                  <br />

                  {dadosCheckout.bairro}

                  {dadosCheckout.complemento && (
                    <>
                      <br />

                      Complemento:{" "}
                      {dadosCheckout.complemento}
                    </>
                  )}
                </p>

              </div>

            </div>

          </section>
        )}

      </section>

      {/* BOTÃO FIXO */}

      <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white/95 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">

        <button
          type="button"
          onClick={
            confirmarPedido
          }
          disabled={
            salvandoPedido ||
            (
              formaPagamento ===
                "pix" &&
              !whatsappLoja
            ) ||
            (
              !pixDisponivel &&
              !cartaoDisponivel
            )
          }
          className={`mx-auto flex h-16 w-full max-w-md items-center justify-between rounded-2xl px-5 text-white shadow-xl transition disabled:bg-zinc-300 ${
            formaPagamento ===
            "cartao"
              ? "bg-blue-600"
              : "bg-green-600"
          }`}
        >

          <div className="flex items-center gap-3">

            {formaPagamento ===
            "cartao" ? (
              <CreditCard
                size={20}
              />
            ) : (
              <MessageCircle
                size={20}
              />
            )}

            <div className="text-left">

              <p className="text-[11px] opacity-80">
                {salvandoPedido
                  ? "Registrando..."
                  : formaPagamento ===
                      "cartao"
                    ? "Pagamento seguro"
                    : "Enviar para a loja"}
              </p>

              <p className="text-[15px] font-extrabold">
                {salvandoPedido
                  ? "Aguarde"
                  : formaPagamento ===
                      "cartao"
                    ? "Pagar com cartão"
                    : "Confirmar pedido"}
              </p>

            </div>

          </div>

          <div className="text-right">

            <span className="font-extrabold">
              {formatarPreco(
                total
              )}
            </span>

            {taxaACombinar && (
              <p className="text-[10px] opacity-80">
                + entrega a combinar
              </p>
            )}

          </div>

        </button>

      </div>

    </main>
  );
}