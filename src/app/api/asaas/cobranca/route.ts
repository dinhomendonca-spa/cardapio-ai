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
export const dynamic = "force-dynamic";

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

type PagamentoPendente = {
  asaas_pagamento_id: string;
  valor: number;
  vencimento: string | null;
  link_pagamento: string | null;
  pix_copia_cola: string | null;
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
  const amanha = new Date(
    Date.now() +
      24 * 60 * 60 * 1000
  );

  return dataBrasil(amanha);
}

function somenteNumeros(
  valor: string | null
) {
  return (
    valor?.replace(/\D/g, "") ??
    ""
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
    throw new Error(
      "Sessão não encontrada."
    );
  }

  const token =
    autorizacao.slice(7).trim();

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

  if (error || !data.user) {
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
    .eq("dono_id", perfil.id)
    .maybeSingle();

  if (erroBusca) {
    throw new Error(
      "Não foi possível verificar sua loja."
    );
  }

  let lojaId: number | undefined;

  if (lojaExistente?.id) {
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
        nome: "Minha loja",
        descricao:
          "Configure os dados da sua loja.",
        dono_id: perfil.id,
        ativo: false,
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
    !Number.isInteger(lojaId) ||
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
        new Date().toISOString(),
    })
    .eq("id", perfil.id);

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
  if (perfil.asaas_cliente_id) {
    return perfil.asaas_cliente_id;
  }

  const cliente =
    await asaasRequest<ClienteAsaas>(
      "/customers",
      {
        method: "POST",
        body: JSON.stringify({
          name: perfil.nome,
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
        new Date().toISOString(),
    })
    .eq("id", perfil.id);

  if (error) {
    throw new Error(
      "Não foi possível salvar o cliente do Asaas."
    );
  }

  return cliente.id;
}

async function prepararAssinatura(
  lojaId: number
) {
  const supabase =
    getSupabaseAdmin();

  const {
    data: assinatura,
    error: erroBusca,
  } = await supabase
    .from("assinaturas")
    .select(
      "loja_id, status, fim_periodo"
    )
    .eq("loja_id", lojaId)
    .maybeSingle();

  if (erroBusca) {
    throw new Error(
      "Não foi possível verificar a assinatura."
    );
  }

  if (!assinatura) {
    const {
      error: erroCriacao,
    } = await supabase
      .from("assinaturas")
      .insert({
        loja_id: lojaId,
        plano: "Mensal",
        valor_mensal: 59.9,
        status: "PENDING",
      });

    if (erroCriacao) {
      throw new Error(
        "Não foi possível preparar a assinatura."
      );
    }

    return;
  }

  const assinaturaAtiva =
    assinatura.status ===
      "ACTIVE" &&
    assinatura.fim_periodo &&
    new Date(
      assinatura.fim_periodo
    ).getTime() >
      Date.now();

  if (assinaturaAtiva) {
    throw new Error(
      "Sua assinatura já está ativa."
    );
  }

  const {
    error: erroAtualizacao,
  } = await supabase
    .from("assinaturas")
    .update({
      plano: "Mensal",
      valor_mensal: 59.9,
      atualizado_em:
        new Date().toISOString(),
    })
    .eq("loja_id", lojaId);

  if (erroAtualizacao) {
    throw new Error(
      "Não foi possível atualizar a assinatura."
    );
  }
}

async function buscarCobrancaPendente(
  lojaId: number
) {
  const hoje =
    dataBrasil(new Date());

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
      "asaas_pagamento_id, valor, vencimento, link_pagamento, pix_copia_cola"
    )
    .eq("loja_id", lojaId)
    .eq("status", "PENDING")
    .gte("vencimento", hoje)
    .order("criado_em", {
      ascending: false,
    })
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

export async function POST(
  request: NextRequest
) {
  try {
    const usuario =
      await obterUsuario(request);

    if (!usuario.email) {
      return responderErro(
        "O usuário não possui e-mail.",
        400
      );
    }

    if (
      !usuario.email_confirmed_at
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
      error: erroPerfil,
    } = await supabase
      .from("perfis")
      .select(
        "id, nome, loja_id, cpf, telefone, cep, endereco, numero, complemento, bairro, cidade, estado, asaas_cliente_id, cadastro_completo"
      )
      .eq("id", usuario.id)
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
      !perfil.cadastro_completo
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
      lojaId
    );

    const clienteId =
      await obterOuCriarCliente(
        perfil,
        usuario.email
      );

    const pendente =
      await buscarCobrancaPendente(
        lojaId
      );

    if (pendente) {
      const pix =
        await obterPix(
          pendente
            .asaas_pagamento_id
        );

      return NextResponse.json({
        reutilizada: true,
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
            pix.payload ||
            pendente
              .pix_copia_cola,
          pixImagem:
            pix.encodedImage,
          pixExpiraEm:
            pix.expirationDate ??
            null,
        },
      });
    }

    const vencimento =
      dataVencimento();

    const cobranca =
      await asaasRequest<CobrancaAsaas>(
        "/payments",
        {
          method: "POST",
          body: JSON.stringify({
            customer: clienteId,
            billingType: "PIX",
            value: 59.9,
            dueDate: vencimento,
            description:
              "Plano Mensal - Visite Minha Loja",
            externalReference:
              `assinatura:${lojaId}`,
          }),
        }
      );

    const pix =
      await obterPix(cobranca.id);

    const {
      error: erroPagamento,
    } = await supabase
      .from(
        "pagamentos_assinatura"
      )
      .insert({
        loja_id: lojaId,
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
          cobranca.invoiceUrl ??
          null,
        pix_copia_cola:
          pix.payload,
      });

    if (erroPagamento) {
      throw new Error(
        "A cobrança foi criada, mas não pôde ser registrada."
      );
    }

    const {
      error: erroAssinatura,
    } = await supabase
      .from("assinaturas")
      .update({
        asaas_ultima_cobranca_id:
          cobranca.id,
        proxima_cobranca:
          cobranca.dueDate,
        atualizado_em:
          new Date().toISOString(),
      })
      .eq("loja_id", lojaId);

    if (erroAssinatura) {
      throw new Error(
        "Não foi possível vincular a cobrança à assinatura."
      );
    }

    return NextResponse.json({
      reutilizada: false,
      pagamento: {
        id: cobranca.id,
        valor:
          Number(
            cobranca.value
          ),
        vencimento:
          cobranca.dueDate,
        link:
          cobranca.invoiceUrl ??
          null,
        pixCopiaCola:
          pix.payload,
        pixImagem:
          pix.encodedImage,
        pixExpiraEm:
          pix.expirationDate ??
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
      mensagem.includes("Sessão")
        ? 401
        : 500;

    return responderErro(
      mensagem,
      status
    );
  }
}