import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import crypto from "crypto";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type NotificacaoMercadoPago = {
  id?: number | string;

  live_mode?: boolean;

  type?: string;

  action?: string;

  user_id?: number | string;

  data?: {
    id?: string | number;
  };
};

/*
 * ==========================================
 * EXTRAIR X-SIGNATURE
 * ==========================================
 */

function extrairAssinatura(
  xSignature: string
) {
  const partes =
    xSignature
      .split(",")
      .map(
        (
          parte
        ) =>
          parte.trim()
      );

  let ts =
    "";

  let v1 =
    "";

  for (
    const parte of
      partes
  ) {
    const [
      chave,
      valor,
    ] =
      parte.split(
        "="
      );

    if (
      chave === "ts"
    ) {
      ts =
        valor || "";
    }

    if (
      chave === "v1"
    ) {
      v1 =
        valor || "";
    }
  }

  return {
    ts,
    v1,
  };
}

/*
 * ==========================================
 * COMPARAÇÃO SEGURA
 * ==========================================
 */

function compararHashes(
  recebido: string,
  esperado: string
) {
  try {
    const recebidoBuffer =
      Buffer.from(
        recebido,
        "hex"
      );

    const esperadoBuffer =
      Buffer.from(
        esperado,
        "hex"
      );

    if (
      recebidoBuffer.length !==
      esperadoBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      recebidoBuffer,
      esperadoBuffer
    );
  } catch {
    return false;
  }
}

/*
 * ==========================================
 * VALIDAR ASSINATURA MERCADO PAGO
 * ==========================================
 */

function validarAssinatura({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string;

  xRequestId: string;

  dataId: string;

  secret: string;
}) {
  const {
    ts,
    v1,
  } =
    extrairAssinatura(
      xSignature
    );

  if (
    !ts ||
    !v1
  ) {
    return false;
  }

  /*
   * Manifest oficial:
   *
   * id:<data.id>;
   * request-id:<x-request-id>;
   * ts:<ts>;
   */

  const manifest =
    `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const assinaturaEsperada =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        manifest
      )
      .digest(
        "hex"
      );

  return compararHashes(
    v1,
    assinaturaEsperada
  );
}

/*
 * ==========================================
 * WEBHOOK
 * ==========================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * ======================================
     * VARIÁVEIS
     * ======================================
     */

    const webhookSecret =
      process.env
        .MERCADO_PAGO_WEBHOOK_SECRET;

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !webhookSecret
    ) {
      console.error(
        "MERCADO_PAGO_WEBHOOK_SECRET não configurado."
      );

      return NextResponse.json(
        {
          error:
            "Webhook não configurado.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        "Supabase não configurado no webhook."
      );

      return NextResponse.json(
        {
          error:
            "Banco não configurado.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ======================================
     * HEADERS
     * ======================================
     */

    const xSignature =
      request.headers.get(
        "x-signature"
      );

    const xRequestId =
      request.headers.get(
        "x-request-id"
      );

    /*
     * Mercado Pago normalmente manda
     * data.id na query string.
     */

    const dataIdQuery =
      request.nextUrl
        .searchParams
        .get(
          "data.id"
        ) ||
      request.nextUrl
        .searchParams
        .get(
          "data_id"
        );

    /*
     * ======================================
     * BODY
     * ======================================
     */

    let body:
      NotificacaoMercadoPago;

    try {
      body =
        (
          await request.json()
        ) as NotificacaoMercadoPago;
    } catch {
      return NextResponse.json(
        {
          error:
            "Body inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Caso data.id não venha na URL,
     * usamos o body apenas como fallback.
     */

    const dataId =
      String(
        dataIdQuery ||
        body.data?.id ||
        ""
      );

    /*
     * ======================================
     * VALIDAR ASSINATURA
     * ======================================
     */

    if (
      !xSignature ||
      !xRequestId ||
      !dataId
    ) {
      console.error(
        "Webhook sem dados suficientes para validar assinatura.",
        {
          possuiSignature:
            Boolean(
              xSignature
            ),

          possuiRequestId:
            Boolean(
              xRequestId
            ),

          possuiDataId:
            Boolean(
              dataId
            ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Assinatura inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const assinaturaValida =
      validarAssinatura({
        xSignature,

        xRequestId,

        dataId,

        secret:
          webhookSecret,
      });

    if (
      !assinaturaValida
    ) {
      console.error(
        "Webhook Mercado Pago rejeitado: assinatura inválida."
      );

      return NextResponse.json(
        {
          error:
            "Assinatura inválida.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ======================================
     * IGNORAR EVENTOS QUE NÃO SÃO ORDER
     * ======================================
     */

    const tipo =
      body.type ||
      request.nextUrl
        .searchParams
        .get(
          "type"
        ) ||
      "";

    if (
      tipo !== "order"
    ) {
      return NextResponse.json(
        {
          received:
            true,

          ignored:
            true,
        },
        {
          status: 200,
        }
      );
    }

    const orderId =
      dataId;

    /*
     * ======================================
     * SUPABASE ADMIN
     * ======================================
     */

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    /*
     * ======================================
     * LOCALIZAR PEDIDO
     * ======================================
     */

    const {
      data:
        pedido,

      error:
        erroPedido,
    } =
      await supabaseAdmin
        .from(
          "pedidos"
        )
        .select(
          "id,loja_id,status,mercado_pago_order_id"
        )
        .eq(
          "mercado_pago_order_id",
          orderId
        )
        .maybeSingle();

    if (
      erroPedido
    ) {
      console.error(
        "Erro ao localizar pedido:",
        erroPedido
      );

      /*
       * O Mercado Pago pode reenviar.
       * Retornamos 500 para permitir retry.
       */

      return NextResponse.json(
        {
          error:
            "Erro ao localizar pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Pode acontecer do webhook chegar
     * alguns milissegundos antes de nossa
     * API salvar o order_id no pedido.
     *
     * Retornamos 500 para o MP tentar
     * novamente depois.
     */

    if (
      !pedido
    ) {
      console.warn(
        "Order ainda não vinculada a um pedido:",
        orderId
      );

      return NextResponse.json(
        {
          error:
            "Pedido ainda não encontrado.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ======================================
     * BUSCAR ACCESS TOKEN DA LOJA
     * ======================================
     */

    const {
      data:
        conta,

      error:
        erroConta,
    } =
      await supabaseAdmin
        .from(
          "mercado_pago_contas"
        )
        .select(
          "access_token"
        )
        .eq(
          "loja_id",
          pedido.loja_id
        )
        .maybeSingle();

    if (
      erroConta
    ) {
      console.error(
        "Erro ao buscar conta Mercado Pago:",
        erroConta
      );

      return NextResponse.json(
        {
          error:
            "Conta Mercado Pago indisponível.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !conta?.access_token
    ) {
      console.error(
        "Pedido possui Order, mas a loja não possui Access Token."
      );

      return NextResponse.json(
        {
          error:
            "Conta Mercado Pago não encontrada.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ======================================
     * CONSULTAR ORDER NO MERCADO PAGO
     * ======================================
     */

    const respostaMercadoPago =
      await fetch(
        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(
          orderId
        )}`,
        {
          method:
            "GET",

          headers: {
            Authorization:
              `Bearer ${conta.access_token}`,

            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    let dadosMercadoPago:
      any =
      null;

    try {
      dadosMercadoPago =
        await respostaMercadoPago.json();
    } catch {
      dadosMercadoPago =
        null;
    }

    if (
      !respostaMercadoPago.ok
    ) {
      console.error(
        "Erro consultando Order Mercado Pago:",
        {
          status:
            respostaMercadoPago.status,

          dados:
            dadosMercadoPago,
        }
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível consultar a Order.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ======================================
     * EXTRAIR STATUS
     * ======================================
     */

    const pagamento =
      dadosMercadoPago
        ?.transactions
        ?.payments
        ?.[0];

    const statusMercadoPago =
      pagamento?.status ??
      dadosMercadoPago?.status ??
      null;

    const statusDetail =
      pagamento
        ?.status_detail ??
      dadosMercadoPago
        ?.status_detail ??
      null;

    /*
     * ======================================
     * CONVERTER STATUS PARA NOSSO PEDIDO
     * ======================================
     */

    let statusPedido =
      pedido.status;

    let pagoEm:
      string | null =
      null;

    if (
      statusMercadoPago ===
      "processed"
    ) {
      statusPedido =
        "novo";

      pagoEm =
        new Date()
          .toISOString();
    } else if (
      statusMercadoPago ===
        "failed" ||
      statusMercadoPago ===
        "cancelled"
    ) {
      statusPedido =
        "pagamento_recusado";

      pagoEm =
        null;
    } else {
      statusPedido =
        "aguardando_pagamento";

      pagoEm =
        null;
    }

    /*
     * ======================================
     * ATUALIZAR PEDIDO
     * ======================================
     */

    const {
      error:
        erroAtualizar,
    } =
      await supabaseAdmin
        .from(
          "pedidos"
        )
        .update({
          mercado_pago_status:
            statusMercadoPago,

          mercado_pago_status_detail:
            statusDetail,

          status:
            statusPedido,

          pago_em:
            pagoEm,
        })
        .eq(
          "id",
          pedido.id
        );

    if (
      erroAtualizar
    ) {
      console.error(
        "Erro atualizando pedido pelo webhook:",
        erroAtualizar
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível atualizar pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ======================================
     * SUCESSO
     * ======================================
     */

    console.log(
      "Webhook Mercado Pago processado:",
      {
        pedidoId:
          pedido.id,

        orderId,

        status:
          statusMercadoPago,

        detail:
          statusDetail,
      }
    );

    return NextResponse.json(
      {
        received:
          true,

        pedidoId:
          pedido.id,

        orderId,

        status:
          statusMercadoPago,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Erro inesperado no webhook Mercado Pago:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ==========================================
 * GET - TESTE DE DISPONIBILIDADE
 * ==========================================
 *
 * Isso NÃO processa webhook.
 * Serve apenas para você abrir a URL
 * e saber que a rota está publicada.
 * ==========================================
 */

export async function GET() {
  return NextResponse.json({
    ok:
      true,

    route:
      "mercadopago-webhook",

    message:
      "Webhook Mercado Pago ativo.",
  });
}