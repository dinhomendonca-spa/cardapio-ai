import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  asaasRequest,
} from "@/lib/asaas";

import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type Perfil = {
  id: string;
  nome: string;
  loja_id: number | null;
  cpf: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  asaas_cliente_id: string | null;
  cadastro_completo: boolean;
};

type ClienteAsaas = {
  id: string;
};

type CobrancaAsaas = {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
};

type PixAsaas = {
  encodedImage: string;
  payload: string;
  expirationDate?: string;
};

type PlanoId =
  | "mensal"
  | "anual";

type PlanoConfiguracao = {
  id: PlanoId;
  nome: string;
  descricao: string;
  valor: number;
  valorMensal: number;
  meses: number;
};

type PagamentoPendente = {
  asaas_pagamento_id: string;
  valor: number;
  vencimento: string | null;
  link_pagamento: string | null;
  pix_copia_cola: string | null;
  plano: string;
  meses_creditados: number;
  valor_contratado: number;
};

const PLANOS: Record<
  PlanoId,
  PlanoConfiguracao
> = {
  mensal: {
    id: "mensal",
    nome: "Mensal",
    descricao:
      "Plano Mensal - Visite Minha Loja",
    valor: 59.9,
    valorMensal: 59.9,
    meses: 1,
  },

  anual: {
    id: "anual",
    nome:
      "Anual Promocional",
    descricao:
      "Plano Anual Promocional - Visite Minha Loja",
    valor: 597,
    valorMensal: 49.75,
    meses: 12,
  },
};

function responderErro(
  mensagem: string,
  status = 400
) {
  return NextResponse.json(
    {
      erro: mensagem,
    },
    {
      status,
    }
  );
}

function dataBrasil(
  data: Date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Sao_Paulo",

      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(data);
}

function dataVencimento() {
  const amanha =
    new Date(
      Date.now() +
        24 *
          60 *
          60 *
          1000
    );

  return dataBrasil(
    amanha
  );
}

function somenteNumeros(
  valor: string | null
) {
  return (
    valor?.replace(
      /\D/g,
      ""
    ) ?? ""
  );
}

function normalizarPlano(
  valor: unknown
): PlanoId | null {
  /*
   * Mantém compatibilidade
   * com a tela antiga.
   *
   * Se nenhum plano for enviado,
   * assume mensal.
   */
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return "mensal";
  }

  if (
    typeof valor !== "string"
  ) {
    return null;
  }

  const plano =
    valor
      .trim()
      .toLowerCase();

  if (
    plano === "mensal"
  ) {
    return "mensal";
  }

  if (
    plano === "anual" ||
    plano ===
      "anual_promocional" ||
    plano ===
      "anual-promocional"
  ) {
    return "anual";
  }

  return null;
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
    throw new Error(
      "Sessão não encontrada."
    );
  }

  const token =
    autorizacao
      .slice(7)
      .trim();

  if (!token) {
    throw new Error(
      "Sessão não encontrada."
    );
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
    throw new Error(
      "Sessão inválida ou expirada."
    );
  }

  return data.user;
}

async function obterOuCriarLoja(
  perfil: Perfil
): Promise<number> {
  const supabase =
    getSupabaseAdmin();

  if (perfil.loja_id) {
    return perfil.loja_id;
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
    | undefined;

  if (
    lojaExistente?.id
  ) {
    lojaId = Number(
      lojaExistente.id
    );
  }

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
      })
      .select("id")
      .single();

    if (
      erroLoja ||
      !novaLoja?.id
    ) {
      throw new Error(
        "Não foi possível preparar sua loja."
      );
    }

    lojaId = Number(
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

  const lojaIdConfirmada =
    lojaId;

  const {
    error: erroPerfil,
  } = await supabase
    .from("perfis")
    .update({
      loja_id:
        lojaIdConfirmada,

      atualizado_em:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      perfil.id
    );

  if (erroPerfil) {
    throw new Error(
      "Não foi possível vincular sua loja."
    );
  }

  return lojaIdConfirmada;
}

async function obterOuCriarCliente(
  perfil: Perfil,
  email: string
) {
  if (
    perfil.asaas_cliente_id
  ) {
    return (
      perfil.asaas_cliente_id
    );
  }

  const cliente =
    await asaasRequest<ClienteAsaas>(
      "/customers",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            name:
              perfil.nome,

            cpfCnpj:
              somenteNumeros(
                perfil.cpf
              ),

            email,

            mobilePhone:
              somenteNumeros(
                perfil.telefone
              ),

            postalCode:
              somenteNumeros(
                perfil.cep
              ),

            address:
              perfil.endereco,

            addressNumber:
              perfil.numero,

            complement:
              perfil.complemento ||
              undefined,

            province:
              perfil.bairro,

            externalReference:
              perfil.id,

            notificationDisabled:
              false,
          }),
      }
    );

  if (!cliente.id) {
    throw new Error(
      "O Asaas não retornou o identificador do cliente."
    );
  }

  const supabase =
    getSupabaseAdmin();

  const {
    error,
  } = await supabase
    .from("perfis")
    .update({
      asaas_cliente_id:
        cliente.id,

      atualizado_em:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      perfil.id
    );

  if (error) {
    throw new Error(
      "Não foi possível salvar o cliente do Asaas."
    );
  }

  return cliente.id;
}

async function prepararAssinatura(
  lojaId: number,
  plano: PlanoConfiguracao
) {
  const supabase =
    getSupabaseAdmin();

  const {
    data: assinatura,
    error: erroBusca,
  } = await supabase
    .from("assinaturas")
    .select(
      `
        loja_id,
        status,
        fim_periodo
      `
    )
    .eq(
      "loja_id",
      lojaId
    )
    .maybeSingle();

  if (erroBusca) {
    throw new Error(
      "Não foi possível verificar a assinatura."
    );
  }

  if (!assinatura) {
    const {
      error:
        erroCriacao,
    } = await supabase
      .from(
        "assinaturas"
      )
      .insert({
        loja_id:
          lojaId,

        plano:
          plano.nome,

        valor_mensal:
          plano.valorMensal,

        status:
          "PENDING",
      });

    if (erroCriacao) {
      throw new Error(
        "Não foi possível preparar a assinatura."
      );
    }

    return;
  }

  const fimPeriodo =
    assinatura.fim_periodo
      ? new Date(
          assinatura
            .fim_periodo
        )
      : null;

  const fimPeriodoValido =
    fimPeriodo &&
    !Number.isNaN(
      fimPeriodo.getTime()
    );

  const assinaturaAtiva =
    assinatura.status ===
      "ACTIVE" &&
    fimPeriodoValido &&
    fimPeriodo.getTime() >
      Date.now();

  /*
   * Por enquanto, quem já possui
   * assinatura ativa não gera uma
   * nova cobrança.
   *
   * Depois podemos criar uma tela
   * específica de renovação.
   */
  if (assinaturaAtiva) {
    throw new Error(
      "Sua assinatura já está ativa."
    );
  }

  const {
    error:
      erroAtualizacao,
  } = await supabase
    .from("assinaturas")
    .update({
      plano:
        plano.nome,

      valor_mensal:
        plano.valorMensal,

      atualizado_em:
        new Date()
          .toISOString(),
    })
    .eq(
      "loja_id",
      lojaId
    );

  if (
    erroAtualizacao
  ) {
    throw new Error(
      "Não foi possível atualizar a assinatura."
    );
  }
}

async function buscarCobrancaPendente(
  lojaId: number,
  planoId: PlanoId
) {
  const hoje =
    dataBrasil(
      new Date()
    );

  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .select(
      `
        asaas_pagamento_id,
        valor,
        vencimento,
        link_pagamento,
        pix_copia_cola,
        plano,
        meses_creditados,
        valor_contratado
      `
    )
    .eq(
      "loja_id",
      lojaId
    )
    .eq(
      "status",
      "PENDING"
    )
    .eq(
      "plano",
      planoId
    )
    .gte(
      "vencimento",
      hoje
    )
    .order(
      "criado_em",
      {
        ascending:
          false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Não foi possível verificar cobranças pendentes."
    );
  }

  return data as
    | PagamentoPendente
    | null;
}

async function obterPix(
  pagamentoId: string
) {
  return asaasRequest<PixAsaas>(
    `/payments/${encodeURIComponent(
      pagamentoId
    )}/pixQrCode`
  );
}

async function obterPixOpcional(
  pagamentoId: string
): Promise<
  PixAsaas | null
> {
  try {
    return await obterPix(
      pagamentoId
    );
  } catch (error) {
    /*
     * A cobrança não deve falhar
     * inteira caso o QR Code Pix
     * esteja temporariamente
     * indisponível.
     *
     * O cliente ainda poderá abrir
     * a invoiceUrl do Asaas e pagar
     * usando cartão.
     */
    console.error(
      "Não foi possível obter o QR Code Pix:",
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * A página nova enviará:
     *
     * { plano: "mensal" }
     *
     * ou
     *
     * { plano: "anual" }
     *
     * A ausência do campo mantém
     * compatibilidade com a página
     * antiga e assume mensal.
     */

    const corpo =
      await request
        .clone()
        .json()
        .catch(
          () => ({})
        );

    const planoId =
      normalizarPlano(
        corpo?.plano
      );

    if (!planoId) {
      return responderErro(
        "Plano inválido.",
        400
      );
    }

    const plano =
      PLANOS[
        planoId
      ];

    const usuario =
      await obterUsuario(
        request
      );

    if (
      !usuario.email
    ) {
      return responderErro(
        "O usuário não possui e-mail.",
        400
      );
    }

    if (
      !usuario
        .email_confirmed_at
    ) {
      return responderErro(
        "Confirme seu e-mail antes de continuar.",
        403
      );
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error:
        erroPerfil,
    } = await supabase
      .from("perfis")
      .select(
        `
          id,
          nome,
          loja_id,
          cpf,
          telefone,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          asaas_cliente_id,
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
      !data
    ) {
      return responderErro(
        "Perfil não encontrado.",
        404
      );
    }

    const perfil =
      data as Perfil;

    if (
      !perfil
        .cadastro_completo
    ) {
      return responderErro(
        "Complete seus dados cadastrais antes de continuar.",
        400
      );
    }

    const lojaId:
      number =
      await obterOuCriarLoja(
        perfil
      );

    await prepararAssinatura(
      lojaId,
      plano
    );

    const clienteId =
      await obterOuCriarCliente(
        perfil,
        usuario.email
      );

    /*
     * Só reutiliza cobrança
     * pendente se ela for do
     * MESMO plano escolhido.
     *
     * Assim uma cobrança mensal
     * antiga não será reutilizada
     * quando o cliente escolher
     * o anual.
     */
    const pendente =
      await buscarCobrancaPendente(
        lojaId,
        plano.id
      );

    if (pendente) {
      const pix =
        await obterPixOpcional(
          pendente
            .asaas_pagamento_id
        );

      return NextResponse.json({
        reutilizada:
          true,

        plano: {
          id:
            plano.id,

          nome:
            plano.nome,

          valor:
            plano.valor,

          valorMensal:
            plano.valorMensal,

          meses:
            plano.meses,
        },

        pagamento: {
          id:
            pendente
              .asaas_pagamento_id,

          valor:
            Number(
              pendente.valor
            ),

          vencimento:
            pendente.vencimento,

          link:
            pendente
              .link_pagamento,

          pixCopiaCola:
            pix?.payload ||
            pendente
              .pix_copia_cola ||
            null,

          pixImagem:
            pix?.encodedImage ??
            null,

          pixExpiraEm:
            pix
              ?.expirationDate ??
            null,
        },
      });
    }

    const vencimento =
      dataVencimento();

    /*
     * UNDEFINED é proposital.
     *
     * Na fatura do Asaas o cliente
     * poderá escolher a forma de
     * pagamento habilitada:
     *
     * - Pix
     * - Cartão de crédito
     *
     * Nós continuamos recuperando
     * o QR Code Pix normalmente.
     */
    const cobranca =
      await asaasRequest<CobrancaAsaas>(
        "/payments",
        {
          method:
            "POST",

          body:
            JSON.stringify({
              customer:
                clienteId,

              billingType:
                "UNDEFINED",

              value:
                plano.valor,

              dueDate:
                vencimento,

              description:
                plano.descricao,

              externalReference:
                `assinatura:${lojaId}:${plano.id}`,
            }),
        }
      );

    if (
      !cobranca.id
    ) {
      throw new Error(
        "O Asaas não retornou o identificador da cobrança."
      );
    }

    const pix =
      await obterPixOpcional(
        cobranca.id
      );

    /*
     * Aqui registramos exatamente
     * o que essa cobrança compra.
     *
     * MENSAL:
     * plano = mensal
     * meses = 1
     * valor = 59,90
     *
     * ANUAL:
     * plano = anual
     * meses = 12
     * valor = 597,00
     */
    const {
      error:
        erroPagamento,
    } = await supabase
      .from(
        "pagamentos_assinatura"
      )
      .insert({
        loja_id:
          lojaId,

        asaas_pagamento_id:
          cobranca.id,

        status:
          cobranca.status ||
          "PENDING",

        valor:
          cobranca.value,

        vencimento:
          cobranca.dueDate,

        link_pagamento:
          cobranca
            .invoiceUrl ??
          null,

        pix_copia_cola:
          pix?.payload ??
          null,

        plano:
          plano.id,

        meses_creditados:
          plano.meses,

        valor_contratado:
          plano.valor,
      });

    if (
      erroPagamento
    ) {
      throw new Error(
        "A cobrança foi criada, mas não pôde ser registrada."
      );
    }

    /*
     * Enquanto o pagamento ainda
     * não foi confirmado, deixamos
     * a última cobrança registrada.
     *
     * Quando o webhook receber o
     * pagamento:
     *
     * mensal -> libera 1 mês
     * anual  -> libera 12 meses
     */
    const {
      error:
        erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .update({
        plano:
          plano.nome,

        valor_mensal:
          plano.valorMensal,

        asaas_ultima_cobranca_id:
          cobranca.id,

        proxima_cobranca:
          cobranca.dueDate,

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "loja_id",
        lojaId
      );

    if (
      erroAssinatura
    ) {
      throw new Error(
        "Não foi possível vincular a cobrança à assinatura."
      );
    }

    return NextResponse.json({
      reutilizada:
        false,

      plano: {
        id:
          plano.id,

        nome:
          plano.nome,

        valor:
          plano.valor,

        valorMensal:
          plano.valorMensal,

        meses:
          plano.meses,
      },

      pagamento: {
        id:
          cobranca.id,

        valor:
          Number(
            cobranca.value
          ),

        vencimento:
          cobranca.dueDate,

        link:
          cobranca
            .invoiceUrl ??
          null,

        pixCopiaCola:
          pix?.payload ??
          null,

        pixImagem:
          pix?.encodedImage ??
          null,

        pixExpiraEm:
          pix
            ?.expirationDate ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao criar cobrança Asaas:",
      error instanceof Error
        ? error.message
        : error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Não foi possível gerar a cobrança.";

    const status =
      mensagem.includes(
        "Sessão"
      )
        ? 401
        : 500;

    return responderErro(
      mensagem,
      status
    );
  }
}