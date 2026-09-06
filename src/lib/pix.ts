function removerAcentos(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function limparTexto(
  valor: string,
  tamanhoMaximo: number
) {
  return removerAcentos(valor)
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, tamanhoMaximo);
}

function tamanhoUtf8(valor: string) {
  return new TextEncoder().encode(valor).length;
}

function campo(
  id: string,
  valor: string
) {
  const tamanho = tamanhoUtf8(valor);

  if (tamanho > 99) {
    throw new Error(
      `Campo Pix ${id} excedeu 99 bytes.`
    );
  }

  return `${id}${tamanho
    .toString()
    .padStart(2, "0")}${valor}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  const bytes =
    new TextEncoder().encode(payload);

  for (const byte of bytes) {
    crc ^= byte << 8;

    for (
      let i = 0;
      i < 8;
      i++
    ) {
      if (
        (crc & 0x8000) !==
        0
      ) {
        crc =
          ((crc << 1) ^
            0x1021) &
          0xffff;
      } else {
        crc =
          (crc << 1) &
          0xffff;
      }
    }
  }

  return crc
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
}

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function normalizarTelefonePix(
  valor: string
) {
  const original =
    valor.trim();

  let numeros =
    somenteNumeros(original);

  /*
   * Exemplo digitado:
   * 22999999999
   *
   * vira:
   * +5522999999999
   */
  if (
    numeros.length === 10 ||
    numeros.length === 11
  ) {
    numeros =
      `55${numeros}`;
  }

  return `+${numeros}`;
}

function normalizarChavePix(
  chave: string
) {
  const valor =
    chave.trim();

  if (!valor) {
    throw new Error(
      "Chave Pix não informada."
    );
  }

  /*
   * E-mail
   */
  if (
    valor.includes("@")
  ) {
    return valor
      .toLowerCase()
      .trim();
  }

  /*
   * EVP / chave aleatória UUID
   */
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  if (
    uuidRegex.test(valor)
  ) {
    return valor.toLowerCase();
  }

  const numeros =
    somenteNumeros(valor);

  /*
   * CPF
   */
  if (
    numeros.length === 11 &&
    !valor.startsWith("+")
  ) {
    /*
     * Existe ambiguidade:
     * 11 dígitos podem ser CPF
     * ou celular brasileiro.
     *
     * Se foi digitado com caracteres
     * de telefone, tratamos como telefone.
     */
    if (
      valor.includes("(") ||
      valor.includes(")") ||
      valor.includes(" ") ||
      valor.startsWith("+")
    ) {
      return normalizarTelefonePix(
        valor
      );
    }

    return numeros;
  }

  /*
   * CNPJ
   */
  if (
    numeros.length === 14
  ) {
    return numeros;
  }

  /*
   * Telefone já começando com +55
   */
  if (
    valor.startsWith("+")
  ) {
    return normalizarTelefonePix(
      valor
    );
  }

  /*
   * Telefone sem código do país
   */
  if (
    numeros.length === 10
  ) {
    return normalizarTelefonePix(
      valor
    );
  }

  /*
   * Qualquer outro formato
   * preservamos como informado,
   * porque pode ser uma chave EVP
   * fora do padrão esperado.
   */
  return valor;
}

type PixParams = {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  descricao?: string;
};

export function gerarPix({
  chave,
  nome,
  cidade,
  valor,
  descricao = "PEDIDO",
}: PixParams) {
  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    throw new Error(
      "Valor Pix inválido."
    );
  }

  const chaveNormalizada =
    normalizarChavePix(
      chave
    );

  const nomeNormalizado =
    limparTexto(
      nome || "RECEBEDOR",
      25
    );

  const cidadeNormalizada =
    limparTexto(
      cidade || "BRASIL",
      15
    );

  const descricaoNormalizada =
    limparTexto(
      descricao,
      25
    );

  /*
   * Merchant Account Information
   *
   * 00 = GUI oficial do Pix
   * 01 = chave Pix
   * 02 = descrição opcional
   */
  let merchantAccount =
    campo(
      "00",
      "BR.GOV.BCB.PIX"
    ) +
    campo(
      "01",
      chaveNormalizada
    );

  if (
    descricaoNormalizada
  ) {
    merchantAccount +=
      campo(
        "02",
        descricaoNormalizada
      );
  }

  /*
   * Additional Data Field Template
   *
   * TXID "***" representa
   * transação sem TXID específico.
   */
  const additionalData =
    campo(
      "05",
      "***"
    );

  const valorFormatado =
    valor.toFixed(2);

  const payloadSemCrc =
    campo(
      "00",
      "01"
    ) +
    campo(
      "26",
      merchantAccount
    ) +
    campo(
      "52",
      "0000"
    ) +
    campo(
      "53",
      "986"
    ) +
    campo(
      "54",
      valorFormatado
    ) +
    campo(
      "58",
      "BR"
    ) +
    campo(
      "59",
      nomeNormalizado
    ) +
    campo(
      "60",
      cidadeNormalizada
    ) +
    campo(
      "62",
      additionalData
    ) +
    "6304";

  const crc =
    crc16(
      payloadSemCrc
    );

  return (
    payloadSemCrc +
    crc
  );
}