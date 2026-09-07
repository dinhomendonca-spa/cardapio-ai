import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

import {
  createClient,
} from "@supabase/supabase-js";

type MercadoPagoTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number;
  refresh_token?: string;
  public_key?: string;
  live_mode?: boolean;
};

function extrairLojaDoState(
  state: string
) {
  const segredo =
    process.env
      .MERCADO_PAGO_STATE_SECRET ||
    process.env
      .MERCADO_PAGO_CLIENT_SECRET;

  if (!segredo) {
    throw new Error(
      "Segredo do state não configurado."
    );
  }

  let decoded = "";

  try {
    decoded =
      Buffer.from(
        state,
        "base64url"
      ).toString(
        "utf8"
      );
  } catch {
    throw new Error(
      "State inválido."
    );
  }

  const partes =
    decoded.split(".");

  if (
    partes.length !== 3
  ) {
    throw new Error(
      "State inválido."
    );
  }

  const [
    lojaId,
    nonce,
    assinaturaRecebida,
  ] = partes;

  const payload =
    `${lojaId}.${nonce}`;

  const assinaturaEsperada =
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

  const recebida =
    Buffer.from(
      assinaturaRecebida,
      "utf8"
    );

  const esperada =
    Buffer.from(
      assinaturaEsperada,
      "utf8"
    );

  if (
    recebida.length !==
    esperada.length
  ) {
    throw new Error(
      "Assinatura do state inválida."
    );
  }

  const assinaturaValida =
    crypto.timingSafeEqual(
      recebida,
      esperada
    );

  if (
    !assinaturaValida
  ) {
    throw new Error(
      "Assinatura do state inválida."
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
    throw new Error(
      "Loja inválida."
    );
  }

  return lojaIdNumerico;
}

export async function GET(
  request: NextRequest
) {
  const origem =
    new URL(
      request.url
    ).origin;

  try {
    const clientId =
      process.env
        .MERCADO_PAGO_CLIENT_ID;

    const clientSecret =
      process.env
        .MERCADO_PAGO_CLIENT_SECRET;

    const redirectUri =
      process.env
        .MERCADO_PAGO_REDIRECT_URI;

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId) {
      throw new Error(
        "MERCADO_PAGO_CLIENT_ID não configurado."
      );
    }

    if (!clientSecret) {
      throw new Error(
        "MERCADO_PAGO_CLIENT_SECRET não configurado."
      );
    }

    if (!redirectUri) {
      throw new Error(
        "MERCADO_PAGO_REDIRECT_URI não configurado."
      );
    }

    if (!supabaseUrl) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL não configurado."
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY não configurado."
      );
    }

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const code =
      searchParams.get(
        "code"
      );

    const state =
      searchParams.get(
        "state"
      );

    const erroMercadoPago =
      searchParams.get(
        "error"
      );

    if (
      erroMercadoPago
    ) {
      console.error(
        "Mercado Pago retornou erro:",
        erroMercadoPago
      );

      return NextResponse.redirect(
        `${origem}/admin/pagamento?mercadopago=cancelado`
      );
    }

    if (!code) {
      throw new Error(
        "Código de autorização não informado."
      );
    }

    if (!state) {
      throw new Error(
        "State não informado."
      );
    }

    const lojaId =
      extrairLojaDoState(
        state
      );

    const resposta =
      await fetch(
        "https://api.mercadopago.com/oauth/token",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify({
              client_id:
                clientId,

              client_secret:
                clientSecret,

              grant_type:
                "authorization_code",

              code,

              redirect_uri:
                redirectUri,
            }),

          cache:
            "no-store",
        }
      );

    const dados =
      (
        await resposta.json()
      ) as MercadoPagoTokenResponse;

    if (
      !resposta.ok
    ) {
      console.error(
        "Erro OAuth Mercado Pago:",
        dados
      );

      throw new Error(
        "Não foi possível obter as credenciais do Mercado Pago."
      );
    }

    if (
      !dados.access_token
    ) {
      throw new Error(
        "Mercado Pago não retornou access_token."
      );
    }

    if (
      !dados.user_id
    ) {
      throw new Error(
        "Mercado Pago não retornou user_id."
      );
    }

    let expiresAt:
      string | null =
      null;

    if (
      dados.expires_in
    ) {
      const data =
        new Date();

      data.setSeconds(
        data.getSeconds() +
          dados.expires_in
      );

      expiresAt =
        data.toISOString();
    }

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

    const {
      data:
        lojaExiste,

      error:
        erroLoja,
    } =
      await supabaseAdmin
        .from(
          "lojas"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          lojaId
        )
        .maybeSingle();

    if (
      erroLoja
    ) {
      throw erroLoja;
    }

    if (
      !lojaExiste
    ) {
      throw new Error(
        "Loja não encontrada."
      );
    }

    const {
      error:
        erroCredenciais,
    } =
      await supabaseAdmin
        .from(
          "mercado_pago_contas"
        )
        .upsert(
          {
            loja_id:
              lojaId,

            mercado_pago_user_id:
              String(
                dados.user_id
              ),

            access_token:
              dados.access_token,

            refresh_token:
              dados.refresh_token ??
              null,

            public_key:
              dados.public_key ??
              null,

            live_mode:
              dados.live_mode ??
              false,

            expires_at:
              expiresAt,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "loja_id",
          }
        );

    if (
      erroCredenciais
    ) {
      throw erroCredenciais;
    }

    /*
     * IMPORTANTE:
     *
     * Conectar Mercado Pago NÃO
     * ativa cartão automaticamente.
     *
     * mercado_pago_conectado = true
     * aceita_cartao permanece como está.
     */

    const {
      error:
        erroAtualizarLoja,
    } =
      await supabaseAdmin
        .from(
          "lojas"
        )
        .update({
          mercado_pago_conectado:
            true,
        })
        .eq(
          "id",
          lojaId
        );

    if (
      erroAtualizarLoja
    ) {
      throw erroAtualizarLoja;
    }

    return NextResponse.redirect(
      `${origem}/admin/pagamento?mercadopago=conectado`
    );
  } catch (
    error
  ) {
    console.error(
      "Erro no callback Mercado Pago:",
      error
    );

    return NextResponse.redirect(
      `${origem}/admin/pagamento?mercadopago=erro`
    );
  }
}