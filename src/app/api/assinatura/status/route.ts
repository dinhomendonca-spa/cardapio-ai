import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respostaNaoAutorizada() {
  return NextResponse.json(
    {
      erro: "Sessão inválida ou expirada.",
    },
    {
      status: 401,
    }
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const autorizacao =
      request.headers.get(
        "authorization"
      );

    if (
      !autorizacao?.startsWith(
        "Bearer "
      )
    ) {
      return respostaNaoAutorizada();
    }

    const token =
      autorizacao.slice(7).trim();

    if (!token) {
      return respostaNaoAutorizada();
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data: usuarioData,
      error: erroUsuario,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      erroUsuario ||
      !usuarioData.user
    ) {
      return respostaNaoAutorizada();
    }

    const usuario =
      usuarioData.user;

    const {
      data: perfil,
      error: erroPerfil,
    } = await supabase
      .from("perfis")
      .select("loja_id")
      .eq("id", usuario.id)
      .single();

    if (erroPerfil || !perfil) {
      return NextResponse.json(
        {
          status: "PENDING",
          ativo: false,
          lojaId: null,
          fimPeriodo: null,
          proximaCobranca: null,
        }
      );
    }

    if (!perfil.loja_id) {
      return NextResponse.json(
        {
          status: "PENDING",
          ativo: false,
          lojaId: null,
          fimPeriodo: null,
          proximaCobranca: null,
        }
      );
    }

    const {
      data: assinatura,
      error: erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .select(
        "status, fim_periodo, proxima_cobranca"
      )
      .eq(
        "loja_id",
        perfil.loja_id
      )
      .maybeSingle();

    if (erroAssinatura) {
      throw new Error(
        "Não foi possível consultar a assinatura."
      );
    }

    if (!assinatura) {
      return NextResponse.json(
        {
          status: "PENDING",
          ativo: false,
          lojaId:
            perfil.loja_id,
          fimPeriodo: null,
          proximaCobranca: null,
        }
      );
    }

    const fimPeriodo =
      assinatura.fim_periodo
        ? new Date(
            assinatura.fim_periodo
          )
        : null;

    const ativo =
      assinatura.status ===
        "ACTIVE" &&
      Boolean(fimPeriodo) &&
      fimPeriodo!.getTime() >
        Date.now();

    return NextResponse.json({
      status:
        assinatura.status,
      ativo,
      lojaId:
        perfil.loja_id,
      fimPeriodo:
        assinatura.fim_periodo,
      proximaCobranca:
        assinatura.proxima_cobranca,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar assinatura:",
      error instanceof Error
        ? error.message
        : error
    );

    return NextResponse.json(
      {
        erro: "Não foi possível consultar sua assinatura.",
      },
      {
        status: 500,
      }
    );
  }
}