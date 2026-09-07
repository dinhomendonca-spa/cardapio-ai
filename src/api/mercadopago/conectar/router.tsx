import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

function criarState(
  lojaId: string
) {
  const segredo =
  process.env
    .MERCADO_PAGO_STATE_SECRET ||
  process.env
    .MERCADO_PAGO_CLIENT_SECRET;

  if (!segredo) {
    throw new Error(
      "MERCADO_PAGO_CLIENT_SECRET não configurado."
    );
  }

  const nonce =
    crypto
      .randomBytes(16)
      .toString("hex");

  const payload =
    `${lojaId}.${nonce}`;

  const assinatura =
    crypto
      .createHmac(
        "sha256",
        segredo
      )
      .update(
        payload
      )
      .digest(
        "hex"
      );

  return Buffer
    .from(
      `${payload}.${assinatura}`
    )
    .toString(
      "base64url"
    );
}

export async function GET(
  request: NextRequest
) {
  try {
    const clientId =
      process.env
        .MERCADO_PAGO_CLIENT_ID;

    const redirectUri =
      process.env
        .MERCADO_PAGO_REDIRECT_URI;

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "MERCADO_PAGO_CLIENT_ID não configurado.",
        },
        {
          status: 500,
        }
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        {
          error:
            "MERCADO_PAGO_REDIRECT_URI não configurado.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const lojaId =
      searchParams.get(
        "loja_id"
      );

    if (!lojaId) {
      return NextResponse.json(
        {
          error:
            "loja_id não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const lojaIdNumerico =
      Number(
        lojaId
      );

    if (
      !Number.isInteger(
        lojaIdNumerico
      ) ||
      lojaIdNumerico <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "loja_id inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const state =
      criarState(
        lojaId
      );

    const url =
      new URL(
        "https://auth.mercadopago.com.br/authorization"
      );

    url.searchParams.set(
      "client_id",
      clientId
    );

    url.searchParams.set(
      "response_type",
      "code"
    );

    url.searchParams.set(
      "platform_id",
      "mp"
    );

    url.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    url.searchParams.set(
      "state",
      state
    );

    return NextResponse.redirect(
      url
    );
  } catch (
    error
  ) {
    console.error(
      "Erro ao iniciar OAuth do Mercado Pago:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível iniciar a conexão com o Mercado Pago.",
      },
      {
        status: 500,
      }
    );
  }
}