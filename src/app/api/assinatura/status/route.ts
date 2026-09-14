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
      erro:
        "Sessão inválida ou expirada.",
    },
    {
      status: 401,
    }
  );
}

function somenteNumeros(
  valor: string
) {
  return valor.replace(/\D/g, "");
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
      console.error(
        "Erro ao validar usuário:",
        erroUsuario
      );

      return respostaNaoAutorizada();
    }

    const usuario =
      usuarioData.user;

    const {
      data: perfil,
      error: erroPerfil,
    } = await supabase
      .from("perfis")
      .select(
        "id, loja_id, cpf"
      )
      .eq(
        "id",
        usuario.id
      )
      .maybeSingle();

    if (erroPerfil) {
      console.error(
        "Erro ao consultar perfil:",
        {
          message:
            erroPerfil.message,
          details:
            erroPerfil.details,
          hint:
            erroPerfil.hint,
          code:
            erroPerfil.code,
          usuarioId:
            usuario.id,
        }
      );

      throw new Error(
        `Erro ao consultar perfil: ${erroPerfil.message}`
      );
    }

    if (!perfil) {
      return NextResponse.json({
        status:
          "PENDING",

        ativo:
          false,

        tipoAcesso:
          "SEM_ACESSO" satisfies TipoAcesso,

        lojaId:
          null,

        fimPeriodo:
          null,

        proximaCobranca:
          null,

        testeGratis:
          false,

        testeDisponivel:
          false,

        testeInicio:
          null,

        testeFim:
          null,

        diasRestantesTeste:
          0,

        motivo:
          "PERFIL_NAO_ENCONTRADO",
      });
    }

    const cpf =
      somenteNumeros(
        perfil.cpf ?? ""
      );

    const cpfValido =
      /^\d{11}$/.test(cpf);

    let testeCpf:
      | {
          cpf: string;
          usuario_id: string;
          loja_id: number;
          iniciado_em: string;
          finalizado_em: string;
        }
      | null = null;

    if (cpfValido) {
      const {
        data,
        error:
          erroTesteCpf,
      } = await supabase
        .from(
          "testes_gratis_cpfs"
        )
        .select(
          "cpf, usuario_id, loja_id, iniciado_em, finalizado_em"
        )
        .eq(
          "cpf",
          cpf
        )
        .maybeSingle();

      if (erroTesteCpf) {
        console.error(
          "Erro ao consultar teste por CPF:",
          {
            message:
              erroTesteCpf.message,
            details:
              erroTesteCpf.details,
            hint:
              erroTesteCpf.hint,
            code:
              erroTesteCpf.code,
            usuarioId:
              usuario.id,
          }
        );

        throw new Error(
          `Não foi possível verificar a disponibilidade do teste: ${erroTesteCpf.message}`
        );
      }

      testeCpf =
        data ?? null;
    }

    const cpfJaUtilizouTeste =
      Boolean(testeCpf);

    /*
     * O perfil existe, mas a loja
     * ainda não foi criada.
     *
     * A rota POST do teste criará e
     * vinculará a loja automaticamente.
     */
    if (!perfil.loja_id) {
      return NextResponse.json({
        status:
          "PENDING",

        ativo:
          false,

        tipoAcesso:
          "SEM_ACESSO" satisfies TipoAcesso,

        lojaId:
          null,

        fimPeriodo:
          null,

        proximaCobranca:
          null,

        testeGratis:
          false,

        testeDisponivel:
          cpfValido &&
          !cpfJaUtilizouTeste,

        testeInicio:
          testeCpf?.iniciado_em ??
          null,

        testeFim:
          testeCpf?.finalizado_em ??
          null,

        diasRestantesTeste:
          0,

        cpfValido,

        cpfJaUtilizouTeste,

        motivo:
          cpfJaUtilizouTeste
            ? "CPF_JA_UTILIZOU_TESTE"
            : cpfValido
              ? "LOJA_SERA_CRIADA_AO_ATIVAR"
              : "CPF_INVALIDO",
      });
    }

    const lojaId =
      Number(perfil.loja_id);

    if (
      !Number.isFinite(lojaId) ||
      lojaId <= 0
    ) {
      return NextResponse.json(
        {
          erro:
            "A loja vinculada ao usuário é inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: loja,
      error: erroLoja,
    } = await supabase
      .from("lojas")
      .select(
        "id, acesso_vitalicio, bloqueada_por_assinatura, teste_gratis_utilizado, teste_gratis_inicio, teste_gratis_fim"
      )
      .eq(
        "id",
        lojaId
      )
      .maybeSingle();

    if (erroLoja) {
      console.error(
        "Erro ao consultar loja:",
        {
          message:
            erroLoja.message,
          details:
            erroLoja.details,
          hint:
            erroLoja.hint,
          code:
            erroLoja.code,
          lojaId,
          usuarioId:
            usuario.id,
        }
      );

      throw new Error(
        `Erro ao consultar loja: ${erroLoja.message}`
      );
    }

    if (!loja) {
      return NextResponse.json(
        {
          erro:
            "Loja não encontrada.",
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
    if (
      loja.acesso_vitalicio
    ) {
      if (
        loja.bloqueada_por_assinatura
      ) {
        const {
          error:
            erroDesbloqueio,
        } = await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
          })
          .eq(
            "id",
            lojaId
          );

        if (erroDesbloqueio) {
          console.error(
            "Erro ao desbloquear loja com acesso vitalício:",
            erroDesbloqueio
          );
        }
      }

      return NextResponse.json({
        status:
          "ACTIVE",

        ativo:
          true,

        tipoAcesso:
          "VITALICIO" satisfies TipoAcesso,

        lojaId,

        fimPeriodo:
          null,

        proximaCobranca:
          null,

        testeGratis:
          false,

        testeDisponivel:
          false,

        testeInicio:
          loja.teste_gratis_inicio,

        testeFim:
          loja.teste_gratis_fim,

        diasRestantesTeste:
          0,

        cpfValido,

        cpfJaUtilizouTeste,
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

    const dataFinalTesteValida =
      Boolean(
        testeFimDate &&
          !Number.isNaN(
            testeFimDate.getTime()
          )
      );

    const testeAtivo =
      Boolean(
        loja.teste_gratis_utilizado &&
          testeFimDate &&
          dataFinalTesteValida &&
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
        const {
          error:
            erroDesbloqueioTeste,
        } = await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
          })
          .eq(
            "id",
            lojaId
          );

        if (
          erroDesbloqueioTeste
        ) {
          console.error(
            "Erro ao desbloquear loja em teste:",
            erroDesbloqueioTeste
          );
        }
      }

      return NextResponse.json({
        status:
          "TRIALING",

        ativo:
          true,

        tipoAcesso:
          "TESTE_GRATIS" satisfies TipoAcesso,

        lojaId,

        fimPeriodo:
          loja.teste_gratis_fim,

        proximaCobranca:
          null,

        testeGratis:
          true,

        testeDisponivel:
          false,

        testeInicio:
          loja.teste_gratis_inicio,

        testeFim:
          loja.teste_gratis_fim,

        diasRestantesTeste,

        cpfValido,

        cpfJaUtilizouTeste:
          true,
      });
    }

    /*
     * ASSINATURA PAGA
     *
     * Uma loja pode possuir mais de
     * uma cobrança ou assinatura
     * registrada. Por isso limitamos
     * a consulta a apenas um registro.
     */
    const {
      data:
        assinaturasEncontradas,
      error:
        erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .select(
        "status, fim_periodo, proxima_cobranca"
      )
      .eq(
        "loja_id",
        lojaId
      )
      .limit(1);

    if (erroAssinatura) {
      console.error(
        "Erro detalhado ao consultar assinatura:",
        {
          message:
            erroAssinatura.message,
          details:
            erroAssinatura.details,
          hint:
            erroAssinatura.hint,
          code:
            erroAssinatura.code,
          lojaId,
          usuarioId:
            usuario.id,
        }
      );

      throw new Error(
        `Não foi possível consultar a assinatura: ${erroAssinatura.message}`
      );
    }

    const assinatura =
      assinaturasEncontradas?.[0] ??
      null;

    const fimPeriodoDate =
      assinatura?.fim_periodo
        ? new Date(
            assinatura.fim_periodo
          )
        : null;

    const fimPeriodoValido =
      Boolean(
        fimPeriodoDate &&
          !Number.isNaN(
            fimPeriodoDate.getTime()
          )
      );

    const assinaturaAtiva =
      assinatura?.status ===
        "ACTIVE" &&
      Boolean(
        fimPeriodoDate &&
          fimPeriodoValido &&
          fimPeriodoDate.getTime() >
            agora.getTime()
      );

    if (assinaturaAtiva) {
      if (
        loja.bloqueada_por_assinatura
      ) {
        const {
          error:
            erroDesbloqueioAssinatura,
        } = await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
          })
          .eq(
            "id",
            lojaId
          );

        if (
          erroDesbloqueioAssinatura
        ) {
          console.error(
            "Erro ao desbloquear loja com assinatura:",
            erroDesbloqueioAssinatura
          );
        }
      }

      return NextResponse.json({
        status:
          assinatura?.status ??
          "ACTIVE",

        ativo:
          true,

        tipoAcesso:
          "ASSINATURA" satisfies TipoAcesso,

        lojaId,

        fimPeriodo:
          assinatura?.fim_periodo ??
          null,

        proximaCobranca:
          assinatura
            ?.proxima_cobranca ??
          null,

        testeGratis:
          false,

        testeDisponivel:
          false,

        testeInicio:
          loja.teste_gratis_inicio,

        testeFim:
          loja.teste_gratis_fim,

        diasRestantesTeste:
          0,

        cpfValido,

        cpfJaUtilizouTeste,
      });
    }

    /*
     * SEM ACESSO
     */
    if (
      !loja.bloqueada_por_assinatura
    ) {
      const {
        error:
          erroBloqueio,
      } = await supabase
        .from("lojas")
        .update({
          bloqueada_por_assinatura:
            true,
        })
        .eq(
          "id",
          lojaId
        );

      if (erroBloqueio) {
        console.error(
          "Erro ao bloquear loja sem acesso:",
          erroBloqueio
        );
      }
    }

    const testeDisponivel =
      cpfValido &&
      !cpfJaUtilizouTeste &&
      !loja.teste_gratis_utilizado;

    return NextResponse.json({
      status:
        assinatura?.status ??
        (
          loja.teste_gratis_utilizado
            ? "TRIAL_EXPIRED"
            : "PENDING"
        ),

      ativo:
        false,

      tipoAcesso:
        "SEM_ACESSO" satisfies TipoAcesso,

      lojaId,

      fimPeriodo:
        assinatura?.fim_periodo ??
        null,

      proximaCobranca:
        assinatura
          ?.proxima_cobranca ??
        null,

      testeGratis:
        false,

      testeDisponivel,

      testeInicio:
        loja.teste_gratis_inicio ??
        testeCpf?.iniciado_em ??
        null,

      testeFim:
        loja.teste_gratis_fim ??
        testeCpf?.finalizado_em ??
        null,

      diasRestantesTeste:
        0,

      cpfValido,

      cpfJaUtilizouTeste,

      motivo:
        cpfJaUtilizouTeste
          ? "CPF_JA_UTILIZOU_TESTE"
          : loja.teste_gratis_utilizado
            ? "TESTE_JA_UTILIZADO"
            : cpfValido
              ? "TESTE_DISPONIVEL"
              : "CPF_INVALIDO",
    });
  } catch (error) {
    console.error(
      "Erro ao consultar assinatura:",
      error
    );

    return NextResponse.json(
      {
        erro:
          "Não foi possível consultar seu acesso.",
      },
      {
        status: 500,
      }
    );
  }
}