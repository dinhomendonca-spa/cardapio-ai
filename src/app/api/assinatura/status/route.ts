import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TipoAcesso =
  | "VITALICIO"
  | "TESTE_GRATIS"
  | "ASSINATURA"
  | "SEM_ACESSO";

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

    if (
      erroPerfil ||
      !perfil?.loja_id
    ) {
      return NextResponse.json({
        status: "PENDING",
        ativo: false,
        tipoAcesso:
          "SEM_ACESSO" satisfies TipoAcesso,
        lojaId: null,
        fimPeriodo: null,
        proximaCobranca: null,
        testeGratis: false,
        testeDisponivel: false,
        testeInicio: null,
        testeFim: null,
        diasRestantesTeste: 0,
      });
    }

    const lojaId =
      Number(perfil.loja_id);

    const {
      data: loja,
      error: erroLoja,
    } = await supabase
      .from("lojas")
      .select(
        "id, acesso_vitalicio, bloqueada_por_assinatura, teste_gratis_utilizado, teste_gratis_inicio, teste_gratis_fim"
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

    const agora =
      new Date();

    /*
     * ACESSO VITALÍCIO
     */
    if (loja.acesso_vitalicio) {
      if (
        loja.bloqueada_por_assinatura
      ) {
        await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
          })
          .eq("id", lojaId);
      }

      return NextResponse.json({
        status: "ACTIVE",
        ativo: true,
        tipoAcesso:
          "VITALICIO" satisfies TipoAcesso,
        lojaId,
        fimPeriodo: null,
        proximaCobranca: null,
        testeGratis: false,
        testeDisponivel: false,
        testeInicio:
          loja.teste_gratis_inicio,
        testeFim:
          loja.teste_gratis_fim,
        diasRestantesTeste: 0,
      });
    }

    /*
     * TESTE GRÁTIS
     */
    const testeFimDate =
      loja.teste_gratis_fim
        ? new Date(
            loja.teste_gratis_fim
          )
        : null;

    const testeAtivo =
      Boolean(
        loja.teste_gratis_utilizado &&
          testeFimDate &&
          testeFimDate.getTime() >
            agora.getTime()
      );

    if (
      testeAtivo &&
      testeFimDate
    ) {
      const milissegundosRestantes =
        testeFimDate.getTime() -
        agora.getTime();

      const diasRestantesTeste =
        Math.max(
          1,
          Math.ceil(
            milissegundosRestantes /
              (
                24 *
                60 *
                60 *
                1000
              )
          )
        );

      if (
        loja.bloqueada_por_assinatura
      ) {
        await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
          })
          .eq("id", lojaId);
      }

      return NextResponse.json({
        status: "TRIALING",
        ativo: true,
        tipoAcesso:
          "TESTE_GRATIS" satisfies TipoAcesso,
        lojaId,
        fimPeriodo:
          loja.teste_gratis_fim,
        proximaCobranca: null,
        testeGratis: true,
        testeDisponivel: false,
        testeInicio:
          loja.teste_gratis_inicio,
        testeFim:
          loja.teste_gratis_fim,
        diasRestantesTeste,
      });
    }

    /*
     * ASSINATURA PAGA
     */
    const {
      data: assinatura,
      error: erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .select(
        "status, fim_periodo, proxima_cobranca"
      )
      .eq("loja_id", lojaId)
      .maybeSingle();

    if (erroAssinatura) {
      throw new Error(
        "Não foi possível consultar a assinatura."
      );
    }

    const fimPeriodoDate =
      assinatura?.fim_periodo
        ? new Date(
            assinatura.fim_periodo
          )
        : null;

    const assinaturaAtiva =
      assinatura?.status ===
        "ACTIVE" &&
      Boolean(fimPeriodoDate) &&
      fimPeriodoDate!.getTime() >
        agora.getTime();

    if (assinaturaAtiva) {
      if (
        loja.bloqueada_por_assinatura
      ) {
        await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
          })
          .eq("id", lojaId);
      }

      return NextResponse.json({
        status:
          assinatura?.status ??
          "ACTIVE",
        ativo: true,
        tipoAcesso:
          "ASSINATURA" satisfies TipoAcesso,
        lojaId,
        fimPeriodo:
          assinatura?.fim_periodo ??
          null,
        proximaCobranca:
          assinatura?.proxima_cobranca ??
          null,
        testeGratis: false,
        testeDisponivel: false,
        testeInicio:
          loja.teste_gratis_inicio,
        testeFim:
          loja.teste_gratis_fim,
        diasRestantesTeste: 0,
      });
    }

    /*
     * SEM ACESSO
     */
    if (
      !loja.bloqueada_por_assinatura
    ) {
      await supabase
        .from("lojas")
        .update({
          bloqueada_por_assinatura:
            true,
        })
        .eq("id", lojaId);
    }

    const testeDisponivel =
      !loja.teste_gratis_utilizado;

    return NextResponse.json({
      status:
        assinatura?.status ??
        (
          loja.teste_gratis_utilizado
            ? "TRIAL_EXPIRED"
            : "PENDING"
        ),
      ativo: false,
      tipoAcesso:
        "SEM_ACESSO" satisfies TipoAcesso,
      lojaId,
      fimPeriodo:
        assinatura?.fim_periodo ??
        null,
      proximaCobranca:
        assinatura?.proxima_cobranca ??
        null,
      testeGratis: false,
      testeDisponivel,
      testeInicio:
        loja.teste_gratis_inicio,
      testeFim:
        loja.teste_gratis_fim,
      diasRestantesTeste: 0,
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