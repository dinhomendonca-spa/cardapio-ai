import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type CorpoRequisicao = {
  loja_id?: number;
};

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * ==========================================
     * VARIÁVEIS
     * ==========================================
     */

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

    /*
     * ==========================================
     * TOKEN DO USUÁRIO LOGADO
     * ==========================================
     */

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization
        .replace(
          "Bearer ",
          ""
        )
        .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Token de autenticação ausente.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ==========================================
     * SUPABASE ADMIN
     * ==========================================
     */

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

    /*
     * ==========================================
     * VALIDAR TOKEN
     * ==========================================
     */

    const {
      data:
        usuarioData,

      error:
        erroUsuario,
    } =
      await supabaseAdmin
        .auth
        .getUser(
          accessToken
        );

    if (
      erroUsuario ||
      !usuarioData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Sessão inválida ou expirada.",
        },
        {
          status: 401,
        }
      );
    }

    const usuario =
      usuarioData.user;

    /*
     * ==========================================
     * CORPO
     * ==========================================
     */

    let body:
      CorpoRequisicao;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Requisição inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const lojaId =
      Number(
        body.loja_id
      );

    if (
      !Number.isInteger(
        lojaId
      ) ||
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

    /*
     * ==========================================
     * PERFIL DO USUÁRIO
     * ==========================================
     *
     * Aqui está a proteção principal.
     *
     * Não confiamos apenas no loja_id.
     * ==========================================
     */

    const {
      data:
        perfil,

      error:
        erroPerfil,
    } =
      await supabaseAdmin
        .from(
          "perfis"
        )
        .select(
          "id,loja_id,papel,ativo"
        )
        .eq(
          "id",
          usuario.id
        )
        .maybeSingle();

    if (erroPerfil) {
      throw erroPerfil;
    }

    if (!perfil) {
      return NextResponse.json(
        {
          error:
            "Perfil não encontrado.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      perfil.ativo !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário desativado.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Usuário precisa pertencer
     * exatamente à loja solicitada.
     */

    if (
      Number(
        perfil.loja_id
      ) !== lojaId
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para alterar esta loja.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Conexões financeiras são
     * responsabilidade do proprietário.
     */

    if (
      perfil.papel !==
      "proprietario"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente o proprietário pode desconectar o Mercado Pago.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ==========================================
     * CONFIRMAR LOJA
     * ==========================================
     */

    const {
      data:
        loja,

      error:
        erroLoja,
    } =
      await supabaseAdmin
        .from(
          "lojas"
        )
        .select(
          "id,nome,mercado_pago_conectado"
        )
        .eq(
          "id",
          lojaId
        )
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

    /*
     * ==========================================
     * DESATIVAR CARTÃO PRIMEIRO
     * ==========================================
     *
     * Fazemos isso antes de apagar
     * a credencial.
     *
     * Assim, mesmo que a exclusão
     * da credencial tenha algum erro,
     * nenhum novo pagamento por cartão
     * poderá ser iniciado.
     * ==========================================
     */

    const {
      error:
        erroDesativar,
    } =
      await supabaseAdmin
        .from(
          "lojas"
        )
        .update({
          mercado_pago_conectado:
            false,

          aceita_cartao:
            false,
        })
        .eq(
          "id",
          lojaId
        );

    if (erroDesativar) {
      throw erroDesativar;
    }

    /*
     * ==========================================
     * APAGAR CREDENCIAIS LOCAIS
     * ==========================================
     */

    const {
      error:
        erroExcluir,
    } =
      await supabaseAdmin
        .from(
          "mercado_pago_contas"
        )
        .delete()
        .eq(
          "loja_id",
          lojaId
        );

    if (erroExcluir) {
      console.error(
        "Cartão foi desativado, mas houve erro ao excluir credenciais:",
        erroExcluir
      );

      return NextResponse.json(
        {
          error:
            "O cartão foi desativado, mas não foi possível concluir a remoção das credenciais. Tente novamente.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ==========================================
     * SUCESSO
     * ==========================================
     */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Mercado Pago desconectado com sucesso.",
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Erro ao desconectar Mercado Pago:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível desconectar o Mercado Pago.",
      },
      {
        status: 500,
      }
    );
  }
}