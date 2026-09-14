import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DURACAO_TESTE_DIAS = 30;

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

export async function POST(
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

    if (
      erroPerfil ||
      !perfil?.loja_id
    ) {
      return NextResponse.json(
        {
          erro: "Este usuário não possui uma loja vinculada.",
        },
        {
          status: 404,
        }
      );
    }

    const lojaId =
      Number(perfil.loja_id);

    const {
      data: loja,
      error: erroLoja,
    } = await supabase
      .from("lojas")
      .select(
        "id, acesso_vitalicio, teste_gratis_utilizado, teste_gratis_inicio, teste_gratis_fim"
      )
      .eq("id", lojaId)
      .single();

    if (
      erroLoja ||
      !loja
    ) {
      return NextResponse.json(
        {
          erro: "Loja não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (loja.acesso_vitalicio) {
      return NextResponse.json(
        {
          erro: "Esta loja já possui acesso vitalício.",
          codigo: "ACESSO_VITALICIO",
          ativo: true,
          lojaId,
        },
        {
          status: 409,
        }
      );
    }

    const agora =
      new Date();

    const testeFimAtual =
      loja.teste_gratis_fim
        ? new Date(
            loja.teste_gratis_fim
          )
        : null;

    const testeAtivo =
      Boolean(
        loja.teste_gratis_utilizado &&
          testeFimAtual &&
          testeFimAtual.getTime() >
            agora.getTime()
      );

    if (testeAtivo) {
      return NextResponse.json(
        {
          erro: "O teste grátis desta loja já está ativo.",
          codigo: "TESTE_ATIVO",
          ativo: true,
          lojaId,
          testeGratis: true,
          testeInicio:
            loja.teste_gratis_inicio,
          testeFim:
            loja.teste_gratis_fim,
        },
        {
          status: 409,
        }
      );
    }

    if (
      loja.teste_gratis_utilizado
    ) {
      return NextResponse.json(
        {
          erro: "O teste grátis desta loja já foi utilizado.",
          codigo: "TESTE_UTILIZADO",
          ativo: false,
          lojaId,
          testeGratis: false,
          testeInicio:
            loja.teste_gratis_inicio,
          testeFim:
            loja.teste_gratis_fim,
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: assinatura,
      error: erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .select(
        "status, fim_periodo"
      )
      .eq("loja_id", lojaId)
      .maybeSingle();

    if (erroAssinatura) {
      throw new Error(
        "Não foi possível consultar a assinatura da loja."
      );
    }

    const fimPeriodo =
      assinatura?.fim_periodo
        ? new Date(
            assinatura.fim_periodo
          )
        : null;

    const assinaturaAtiva =
      assinatura?.status ===
        "ACTIVE" &&
      Boolean(fimPeriodo) &&
      fimPeriodo!.getTime() >
        agora.getTime();

    if (assinaturaAtiva) {
      return NextResponse.json(
        {
          erro: "Esta loja já possui uma assinatura ativa.",
          codigo: "ASSINATURA_ATIVA",
          ativo: true,
          lojaId,
        },
        {
          status: 409,
        }
      );
    }

    const testeInicio =
      agora.toISOString();

    const testeFimDate =
      new Date(
        agora.getTime() +
          DURACAO_TESTE_DIAS *
            24 *
            60 *
            60 *
            1000
      );

    const testeFim =
      testeFimDate.toISOString();

    const {
      data: lojaAtualizada,
      error: erroAtualizacao,
    } = await supabase
      .from("lojas")
      .update({
        teste_gratis_utilizado:
          true,

        teste_gratis_inicio:
          testeInicio,

        teste_gratis_fim:
          testeFim,

        bloqueada_por_assinatura:
          false,
      })
      .eq("id", lojaId)
      .eq(
        "teste_gratis_utilizado",
        false
      )
      .select(
        "id, teste_gratis_inicio, teste_gratis_fim"
      )
      .maybeSingle();

    if (erroAtualizacao) {
      throw new Error(
        "Não foi possível ativar o teste grátis."
      );
    }

    if (!lojaAtualizada) {
      return NextResponse.json(
        {
          erro: "O teste grátis desta loja já foi ativado.",
          codigo: "TESTE_UTILIZADO",
          ativo: false,
          lojaId,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        mensagem:
          "Seu teste grátis de 30 dias foi ativado com sucesso.",
        codigo:
          "TESTE_ATIVADO",
        ativo: true,
        testeGratis: true,
        lojaId,
        testeInicio:
          lojaAtualizada.teste_gratis_inicio,
        testeFim:
          lojaAtualizada.teste_gratis_fim,
        duracaoDias:
          DURACAO_TESTE_DIAS,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao ativar teste grátis:",
      error instanceof Error
        ? error.message
        : error
    );

    return NextResponse.json(
      {
        erro: "Não foi possível ativar o teste grátis.",
      },
      {
        status: 500,
      }
    );
  }
}