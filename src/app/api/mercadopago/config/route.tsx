import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

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

    const lojaIdTexto =
      request.nextUrl.searchParams.get(
        "loja_id"
      );

    const lojaId =
      Number(lojaIdTexto);

    if (
      !Number.isInteger(lojaId) ||
      lojaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Loja inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    /*
     * Confirmar que cartão está
     * habilitado nessa loja.
     */

    const {
      data: loja,
      error: erroLoja,
    } =
      await supabaseAdmin
        .from("lojas")
        .select(
          "id,ativo,aceita_cartao,mercado_pago_conectado"
        )
        .eq("id", lojaId)
        .maybeSingle();

    if (erroLoja) {
      throw erroLoja;
    }

    if (!loja) {
      return NextResponse.json(
        {
          error:
            "Loja não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (!loja.ativo) {
      return NextResponse.json(
        {
          error:
            "Loja indisponível.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !loja.aceita_cartao ||
      !loja.mercado_pago_conectado
    ) {
      return NextResponse.json(
        {
          error:
            "Pagamento por cartão não está disponível.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Buscar somente a PUBLIC KEY.
     *
     * Access Token e Refresh Token
     * NUNCA são enviados ao navegador.
     */

    const {
      data: conta,
      error: erroConta,
    } =
      await supabaseAdmin
        .from(
          "mercado_pago_contas"
        )
        .select(
          "public_key"
        )
        .eq(
          "loja_id",
          lojaId
        )
        .maybeSingle();

    if (erroConta) {
      throw erroConta;
    }

    if (
      !conta?.public_key
    ) {
      return NextResponse.json(
        {
          error:
            "Conta Mercado Pago sem Public Key.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        publicKey:
          conta.public_key,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar configuração Mercado Pago:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar o Mercado Pago.",
      },
      {
        status: 500,
      }
    );
  }
}