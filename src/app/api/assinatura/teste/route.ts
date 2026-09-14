import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

const DURACAO_TESTE_DIAS =
  30;

type Perfil = {
  id: string;
  nome: string | null;
  loja_id: number | null;
  cpf: string | null;
  cadastro_completo:
    | boolean
    | null;
};

function responderErro(
  erro: string,
  status: number,
  codigo?: string
) {
  return NextResponse.json(
    {
      erro,
      codigo,
    },
    {
      status,
    }
  );
}

function respostaNaoAutorizada() {
  return responderErro(
    "Sessão inválida ou expirada.",
    401,
    "NAO_AUTORIZADO"
  );
}

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function obterCpfsTeste() {
  const valor =
    process.env.TESTER_CPFS ??
    "";

  return valor
    .split(",")
    .map((cpf) =>
      somenteNumeros(
        cpf.trim()
      )
    )
    .filter(
      (cpf) =>
        /^\d{11}$/.test(
          cpf
        )
    );
}

function cpfEhTester(
  cpf: string
) {
  return obterCpfsTeste().includes(
    cpf
  );
}

async function obterUsuario(
  request: NextRequest
) {
  const autorizacao =
    request.headers.get(
      "authorization"
    );

  if (
    !autorizacao?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    autorizacao
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token
    );

  if (
    error ||
    !data.user
  ) {
    return null;
  }

  return data.user;
}

async function obterOuCriarLoja(
  perfil: Perfil
): Promise<number> {
  const supabase =
    getSupabaseAdmin();

  if (
    perfil.loja_id &&
    Number.isInteger(
      Number(
        perfil.loja_id
      )
    ) &&
    Number(
      perfil.loja_id
    ) > 0
  ) {
    return Number(
      perfil.loja_id
    );
  }

  const {
    data: lojaExistente,
    error: erroBusca,
  } = await supabase
    .from("lojas")
    .select("id")
    .eq(
      "dono_id",
      perfil.id
    )
    .maybeSingle();

  if (erroBusca) {
    throw new Error(
      "Não foi possível verificar sua loja."
    );
  }

  let lojaId:
    | number
    | null =
    lojaExistente?.id
      ? Number(
          lojaExistente.id
        )
      : null;

  if (!lojaId) {
    const {
      data: novaLoja,
      error: erroLoja,
    } = await supabase
      .from("lojas")
      .insert({
        nome:
          "Minha loja",

        descricao:
          "Configure os dados da sua loja.",

        dono_id:
          perfil.id,

        ativo:
          false,

        bloqueada_por_assinatura:
          true,

        acesso_vitalicio:
          false,

        teste_gratis_utilizado:
          false,
      })
      .select("id")
      .single();

    if (
      erroLoja ||
      !novaLoja?.id
    ) {
      console.error(
        "Erro ao criar loja para teste:",
        erroLoja
      );

      throw new Error(
        "Não foi possível preparar sua loja."
      );
    }

    lojaId =
      Number(
        novaLoja.id
      );
  }

  if (
    !Number.isInteger(
      lojaId
    ) ||
    lojaId <= 0
  ) {
    throw new Error(
      "Identificador da loja inválido."
    );
  }

  const {
    error: erroPerfil,
  } = await supabase
    .from("perfis")
    .update({
      loja_id:
        lojaId,

      atualizado_em:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      perfil.id
    );

  if (erroPerfil) {
    console.error(
      "Erro ao vincular loja ao perfil:",
      erroPerfil
    );

    throw new Error(
      "Não foi possível vincular sua loja."
    );
  }

  return lojaId;
}

export async function POST(
  request: NextRequest
) {
  const supabase =
    getSupabaseAdmin();

  let cpfRegistrado:
    | string
    | null =
    null;

  let usuarioIdRegistrado:
    | string
    | null =
    null;

  try {
    const usuario =
      await obterUsuario(
        request
      );

    if (!usuario) {
      return respostaNaoAutorizada();
    }

    if (
      !usuario
        .email_confirmed_at
    ) {
      return responderErro(
        "Confirme seu e-mail antes de iniciar o teste.",
        403,
        "EMAIL_NAO_CONFIRMADO"
      );
    }

    const {
      data: perfilData,
      error: erroPerfil,
    } = await supabase
      .from("perfis")
      .select(
        `
          id,
          nome,
          loja_id,
          cpf,
          cadastro_completo
        `
      )
      .eq(
        "id",
        usuario.id
      )
      .single();

    if (
      erroPerfil ||
      !perfilData
    ) {
      return responderErro(
        "Perfil não encontrado.",
        404,
        "PERFIL_NAO_ENCONTRADO"
      );
    }

    const perfil =
      perfilData as Perfil;

    if (
      perfil
        .cadastro_completo ===
      false
    ) {
      return responderErro(
        "Complete seus dados cadastrais antes de iniciar o teste.",
        400,
        "CADASTRO_INCOMPLETO"
      );
    }

    const cpf =
      somenteNumeros(
        perfil.cpf ?? ""
      );

    if (
      !/^\d{11}$/.test(
        cpf
      )
    ) {
      return responderErro(
        "O perfil não possui um CPF válido.",
        400,
        "CPF_INVALIDO"
      );
    }

    /*
     * CPF configurado como
     * homologação/teste interno.
     *
     * Clientes normais continuam
     * sujeitos à regra de um único
     * teste grátis por CPF.
     */
    const modoTester =
      cpfEhTester(
        cpf
      );

    const lojaId =
      await obterOuCriarLoja(
        perfil
      );

    const {
      data: loja,
      error: erroLoja,
    } = await supabase
      .from("lojas")
      .select(
        `
          id,
          acesso_vitalicio,
          bloqueada_por_assinatura,
          teste_gratis_utilizado,
          teste_gratis_inicio,
          teste_gratis_fim
        `
      )
      .eq(
        "id",
        lojaId
      )
      .single();

    if (
      erroLoja ||
      !loja
    ) {
      return responderErro(
        "Loja não encontrada.",
        404,
        "LOJA_NAO_ENCONTRADA"
      );
    }

    /*
     * Acesso vitalício continua
     * prevalecendo mesmo para
     * contas tester.
     */
    if (
      loja.acesso_vitalicio
    ) {
      return NextResponse.json(
        {
          erro:
            "Esta loja já possui acesso vitalício.",

          codigo:
            "ACESSO_VITALICIO",

          ativo:
            true,

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
            loja
              .teste_gratis_fim
          )
        : null;

    const testeAtivo =
      Boolean(
        loja
          .teste_gratis_utilizado &&
          testeFimAtual &&
          testeFimAtual.getTime() >
            agora.getTime()
      );

    /*
     * CLIENTE NORMAL:
     * mantém exatamente a regra
     * existente.
     *
     * TESTER:
     * permite reiniciar o período
     * chamando novamente esta rota.
     */
    if (
      testeAtivo &&
      !modoTester
    ) {
      return NextResponse.json(
        {
          erro:
            "O teste grátis desta loja já está ativo.",

          codigo:
            "TESTE_ATIVO",

          ativo:
            true,

          testeGratis:
            true,

          lojaId,

          testeInicio:
            loja
              .teste_gratis_inicio,

          testeFim:
            loja
              .teste_gratis_fim,
        },
        {
          status: 409,
        }
      );
    }

    if (
      loja
        .teste_gratis_utilizado &&
      !modoTester
    ) {
      return NextResponse.json(
        {
          erro:
            "O teste grátis desta loja já foi utilizado.",

          codigo:
            "TESTE_UTILIZADO",

          ativo:
            false,

          testeGratis:
            false,

          lojaId,

          testeInicio:
            loja
              .teste_gratis_inicio,

          testeFim:
            loja
              .teste_gratis_fim,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Verifica assinatura paga.
     */
    const {
      data: assinatura,
      error: erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .select(
        `
          status,
          fim_periodo
        `
      )
      .eq(
        "loja_id",
        lojaId
      )
      .maybeSingle();

    if (
      erroAssinatura
    ) {
      throw new Error(
        "Não foi possível consultar a assinatura da loja."
      );
    }

    const fimPeriodo =
      assinatura
        ?.fim_periodo
        ? new Date(
            assinatura
              .fim_periodo
          )
        : null;

    const assinaturaAtiva =
      assinatura?.status ===
        "ACTIVE" &&
      Boolean(
        fimPeriodo
      ) &&
      fimPeriodo!.getTime() >
        agora.getTime();

    /*
     * Cliente normal com assinatura
     * ativa não recebe trial.
     *
     * Tester pode reiniciar o trial
     * para fins de homologação.
     */
    if (
      assinaturaAtiva &&
      !modoTester
    ) {
      return NextResponse.json(
        {
          erro:
            "Esta loja já possui uma assinatura ativa.",

          codigo:
            "ASSINATURA_ATIVA",

          ativo:
            true,

          lojaId,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Consulta histórico do CPF.
     */
    const {
      data:
        testeCpfExistente,

      error:
        erroBuscaCpf,
    } = await supabase
      .from(
        "testes_gratis_cpfs"
      )
      .select(
        `
          cpf,
          usuario_id,
          loja_id,
          iniciado_em,
          finalizado_em
        `
      )
      .eq(
        "cpf",
        cpf
      )
      .maybeSingle();

    if (erroBuscaCpf) {
      throw new Error(
        "Não foi possível verificar a disponibilidade do teste para este CPF."
      );
    }

    /*
     * Para clientes reais,
     * qualquer registro anterior
     * continua bloqueando novo teste.
     */
    if (
      testeCpfExistente &&
      !modoTester
    ) {
      return NextResponse.json(
        {
          erro:
            "Este CPF já utilizou o teste grátis.",

          codigo:
            "CPF_JA_UTILIZOU_TESTE",

          ativo:
            false,

          testeGratis:
            false,
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

    /*
     * Para tester:
     * atualiza/substitui o registro
     * existente deste CPF.
     *
     * Para cliente normal:
     * continua utilizando INSERT,
     * preservando a proteção contra
     * múltiplos testes.
     */
    if (modoTester) {
      const {
        error:
          erroRegistroTester,
      } = await supabase
        .from(
          "testes_gratis_cpfs"
        )
        .upsert(
          {
            cpf,

            usuario_id:
              usuario.id,

            loja_id:
              lojaId,

            iniciado_em:
              testeInicio,

            finalizado_em:
              testeFim,
          },
          {
            onConflict:
              "cpf",
          }
        );

      if (
        erroRegistroTester
      ) {
        console.error(
          "Erro ao atualizar CPF tester:",
          erroRegistroTester
        );

        throw new Error(
          "Não foi possível preparar o teste interno."
        );
      }

      cpfRegistrado =
        cpf;

      usuarioIdRegistrado =
        usuario.id;
    } else {
      const {
        error:
          erroRegistroCpf,
      } = await supabase
        .from(
          "testes_gratis_cpfs"
        )
        .insert({
          cpf,

          usuario_id:
            usuario.id,

          loja_id:
            lojaId,

          iniciado_em:
            testeInicio,

          finalizado_em:
            testeFim,
        });

      if (
        erroRegistroCpf
      ) {
        if (
          erroRegistroCpf
            .code ===
          "23505"
        ) {
          return NextResponse.json(
            {
              erro:
                "Este CPF já utilizou o teste grátis.",

              codigo:
                "CPF_JA_UTILIZOU_TESTE",

              ativo:
                false,

              testeGratis:
                false,
            },
            {
              status:
                409,
            }
          );
        }

        console.error(
          "Erro ao registrar CPF do teste:",
          erroRegistroCpf
        );

        throw new Error(
          "Não foi possível reservar o teste grátis para este CPF."
        );
      }

      cpfRegistrado =
        cpf;

      usuarioIdRegistrado =
        usuario.id;
    }

    /*
     * Ativa ou reinicia os
     * 30 dias na loja.
     */
    let queryAtualizacao =
      supabase
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
        .eq(
          "id",
          lojaId
        );

    /*
     * Cliente normal só consegue
     * atualizar uma loja que ainda
     * nunca utilizou trial.
     *
     * Tester pode sobrescrever
     * datas anteriores.
     */
    if (!modoTester) {
      queryAtualizacao =
        queryAtualizacao.eq(
          "teste_gratis_utilizado",
          false
        );
    }

    const {
      data:
        lojaAtualizada,

      error:
        erroAtualizacao,
    } =
      await queryAtualizacao
        .select(
          `
            id,
            teste_gratis_inicio,
            teste_gratis_fim
          `
        )
        .maybeSingle();

    if (
      erroAtualizacao ||
      !lojaAtualizada
    ) {
      /*
       * Em uma ativação normal,
       * remove a reserva incompleta.
       *
       * Para tester também pode
       * remover porque o próximo
       * teste fará novo upsert.
       */
      await supabase
        .from(
          "testes_gratis_cpfs"
        )
        .delete()
        .eq(
          "cpf",
          cpf
        )
        .eq(
          "usuario_id",
          usuario.id
        );

      cpfRegistrado =
        null;

      usuarioIdRegistrado =
        null;

      if (
        erroAtualizacao
      ) {
        console.error(
          "Erro ao ativar teste na loja:",
          erroAtualizacao
        );
      }

      return responderErro(
        "Não foi possível ativar o teste grátis.",
        500,
        "ERRO_ATIVACAO_TESTE"
      );
    }

    cpfRegistrado =
      null;

    usuarioIdRegistrado =
      null;

    return NextResponse.json(
      {
        mensagem:
          modoTester
            ? "Teste interno de 30 dias reiniciado com sucesso."
            : "Seu teste grátis de 30 dias foi ativado com sucesso.",

        codigo:
          modoTester
            ? "TESTE_INTERNO_ATIVADO"
            : "TESTE_ATIVADO",

        ativo:
          true,

        testeGratis:
          true,

        modoTester,

        lojaId,

        testeInicio:
          lojaAtualizada
            .teste_gratis_inicio,

        testeFim:
          lojaAtualizada
            .teste_gratis_fim,

        duracaoDias:
          DURACAO_TESTE_DIAS,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      cpfRegistrado &&
      usuarioIdRegistrado
    ) {
      await supabase
        .from(
          "testes_gratis_cpfs"
        )
        .delete()
        .eq(
          "cpf",
          cpfRegistrado
        )
        .eq(
          "usuario_id",
          usuarioIdRegistrado
        );
    }

    console.error(
      "Erro ao ativar teste grátis:",
      error instanceof Error
        ? error.message
        : error
    );

    return NextResponse.json(
      {
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível ativar o teste grátis.",

        codigo:
          "ERRO_INTERNO",
      },
      {
        status: 500,
      }
    );
  }
}