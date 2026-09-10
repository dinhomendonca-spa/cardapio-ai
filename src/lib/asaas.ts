import "server-only";

type ErroAsaas = {
  code?: string;
  description?: string;
};

type RespostaErroAsaas = {
  errors?: ErroAsaas[];
};

function obterConfiguracaoAsaas() {
  const apiUrl =
    process.env.ASAAS_API_URL;

  const apiKey =
    process.env.ASAAS_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Configuração do Asaas ausente."
    );
  }

  return {
    apiUrl: apiUrl.replace(
      /\/+$/,
      ""
    ),
    apiKey,
  };
}

export async function asaasRequest<T>(
  caminho: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const {
    apiUrl,
    apiKey,
  } = obterConfiguracaoAsaas();

  const resposta = await fetch(
    `${apiUrl}${caminho}`,
    {
      ...opcoes,
      cache: "no-store",
      headers: {
        accept:
          "application/json",
        access_token: apiKey,
        ...(opcoes.body
          ? {
              "content-type":
                "application/json",
            }
          : {}),
        ...opcoes.headers,
      },
    }
  );

  const conteudo =
    (await resposta
      .json()
      .catch(() => null)) as
      | T
      | RespostaErroAsaas
      | null;

  if (!resposta.ok) {
    const erros =
      conteudo &&
      typeof conteudo ===
        "object" &&
      "errors" in conteudo
        ? conteudo.errors
        : undefined;

    const mensagem =
      erros
        ?.map(
          (erro) =>
            erro.description
        )
        .filter(Boolean)
        .join(" ") ||
      `Erro ${resposta.status} ao acessar o Asaas.`;

    throw new Error(mensagem);
  }

  if (!conteudo) {
    throw new Error(
      "O Asaas retornou uma resposta vazia."
    );
  }

  return conteudo as T;
}