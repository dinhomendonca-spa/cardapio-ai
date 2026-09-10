export type TipoChavePix =
  | "CPF"
  | "CNPJ"
  | "E-mail"
  | "Telefone"
  | "Chave aleatória";

export type ResultadoChavePix = {
  valida: boolean;
  tipo: TipoChavePix | null;
  normalizada: string;
  mensagem: string;
};

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function todosIguais(
  valor: string
) {
  return /^(\d)\1+$/.test(
    valor
  );
}

function validarCPF(
  valor: string
) {
  const cpf =
    somenteNumeros(
      valor
    );

  if (
    cpf.length !== 11 ||
    todosIguais(cpf)
  ) {
    return false;
  }

  let soma = 0;

  for (
    let indice = 0;
    indice < 9;
    indice += 1
  ) {
    soma +=
      Number(
        cpf[indice]
      ) *
      (
        10 -
        indice
      );
  }

  let primeiroDigito =
    (
      soma * 10
    ) % 11;

  if (
    primeiroDigito === 10
  ) {
    primeiroDigito = 0;
  }

  if (
    primeiroDigito !==
    Number(cpf[9])
  ) {
    return false;
  }

  soma = 0;

  for (
    let indice = 0;
    indice < 10;
    indice += 1
  ) {
    soma +=
      Number(
        cpf[indice]
      ) *
      (
        11 -
        indice
      );
  }

  let segundoDigito =
    (
      soma * 10
    ) % 11;

  if (
    segundoDigito === 10
  ) {
    segundoDigito = 0;
  }

  return (
    segundoDigito ===
    Number(cpf[10])
  );
}

function validarCNPJ(
  valor: string
) {
  const cnpj =
    somenteNumeros(
      valor
    );

  if (
    cnpj.length !== 14 ||
    todosIguais(cnpj)
  ) {
    return false;
  }

  const calcularDigito = (
    base: string,
    pesos: number[]
  ) => {
    const soma =
      base
        .split("")
        .reduce(
          (
            total,
            numero,
            indice
          ) =>
            total +
            Number(numero) *
              pesos[indice],
          0
        );

    const resto =
      soma % 11;

    return (
      resto < 2
        ? 0
        : 11 - resto
    );
  };

  const primeiroDigito =
    calcularDigito(
      cnpj.slice(0, 12),
      [
        5,
        4,
        3,
        2,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
      ]
    );

  const segundoDigito =
    calcularDigito(
      cnpj.slice(0, 12) +
        primeiroDigito,
      [
        6,
        5,
        4,
        3,
        2,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
      ]
    );

  return (
    cnpj.endsWith(
      `${primeiroDigito}${segundoDigito}`
    )
  );
}

function validarEmail(
  valor: string
) {
  if (
    valor.length > 77
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
    valor
  );
}

function validarTelefone(
  valor: string
) {
  const numeros =
    somenteNumeros(
      valor
    );

  let telefoneNacional =
    numeros;

  if (
    numeros.startsWith(
      "55"
    )
  ) {
    telefoneNacional =
      numeros.slice(2);
  }

  if (
    telefoneNacional.length !==
    11
  ) {
    return false;
  }

  const ddd =
    telefoneNacional.slice(
      0,
      2
    );

  const numero =
    telefoneNacional.slice(
      2
    );

  return (
    /^[1-9][0-9]$/.test(
      ddd
    ) &&
    /^9[0-9]{8}$/.test(
      numero
    )
  );
}

function normalizarTelefone(
  valor: string
) {
  const numeros =
    somenteNumeros(
      valor
    );

  if (
    numeros.startsWith(
      "55"
    )
  ) {
    return `+${numeros}`;
  }

  return `+55${numeros}`;
}

function validarChaveAleatoria(
  valor: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    valor
  );
}

export function validarChavePix(
  valorOriginal: string
): ResultadoChavePix {
  const valor =
    valorOriginal.trim();

  if (!valor) {
    return {
      valida: true,
      tipo: null,
      normalizada: "",
      mensagem:
        "A chave Pix é opcional.",
    };
  }

  if (
    valor.includes("@")
  ) {
    const email =
      valor.toLowerCase();

    if (
      validarEmail(email)
    ) {
      return {
        valida: true,
        tipo: "E-mail",
        normalizada: email,
        mensagem:
          "Chave Pix de e-mail válida.",
      };
    }

    return {
      valida: false,
      tipo: "E-mail",
      normalizada: valor,
      mensagem:
        "Informe um e-mail válido, como financeiro@minhaloja.com.br.",
    };
  }

  if (
    validarChaveAleatoria(
      valor
    )
  ) {
    return {
      valida: true,
      tipo:
        "Chave aleatória",
      normalizada:
        valor.toLowerCase(),
      mensagem:
        "Chave Pix aleatória válida.",
    };
  }

  const numeros =
    somenteNumeros(
      valor
    );

  if (
    numeros.length === 14
  ) {
    if (
      validarCNPJ(
        numeros
      )
    ) {
      return {
        valida: true,
        tipo: "CNPJ",
        normalizada:
          numeros,
        mensagem:
          "Chave Pix de CNPJ válida.",
      };
    }

    return {
      valida: false,
      tipo: "CNPJ",
      normalizada:
        numeros,
      mensagem:
        "O CNPJ informado é inválido. Confira os 14 números.",
    };
  }

  const pareceTelefone =
    valor.startsWith("+") ||
    valor.includes("(") ||
    valor.includes(")") ||
    numeros.startsWith(
      "55"
    );

  if (
    numeros.length === 11 &&
    !pareceTelefone &&
    validarCPF(numeros)
  ) {
    return {
      valida: true,
      tipo: "CPF",
      normalizada:
        numeros,
      mensagem:
        "Chave Pix de CPF válida.",
    };
  }

  if (
    pareceTelefone ||
    numeros.length === 11 ||
    numeros.length === 13
  ) {
    if (
      validarTelefone(
        valor
      )
    ) {
      return {
        valida: true,
        tipo:
          "Telefone",
        normalizada:
          normalizarTelefone(
            valor
          ),
        mensagem:
          "Chave Pix de telefone válida.",
      };
    }

    if (
      numeros.length === 11 &&
      validarCPF(numeros)
    ) {
      return {
        valida: true,
        tipo: "CPF",
        normalizada:
          numeros,
        mensagem:
          "Chave Pix de CPF válida.",
      };
    }

    return {
      valida: false,
      tipo:
        "Telefone",
      normalizada:
        valor,
      mensagem:
        "Use um celular com DDD: (22) 99999-9999 ou +5522999999999.",
    };
  }

  return {
    valida: false,
    tipo: null,
    normalizada:
      valor,
    mensagem:
      "Use um CPF, CNPJ, e-mail, celular com DDD ou chave aleatória válida.",
  };
}