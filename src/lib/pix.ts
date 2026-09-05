function campo(id: string, valor: string) {
  return `${id}${valor.length.toString().padStart(2, "0")}${valor}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      crc =
        (crc & 0x8000) !== 0
          ? ((crc << 1) ^ 0x1021) & 0xffff
          : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
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
  const merchantAccount =
    campo("00", "BR.GOV.BCB.PIX") +
    campo("01", chave) +
    campo("02", descricao.slice(0, 25));

  const payloadSemCrc =
    campo("00", "01") +
    campo("26", merchantAccount) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", valor.toFixed(2)) +
    campo("58", "BR") +
    campo("59", nome.toUpperCase().slice(0, 25)) +
    campo("60", cidade.toUpperCase().slice(0, 15)) +
    campo("62", campo("05", "***")) +
    "6304";

  return payloadSemCrc + crc16(payloadSemCrc);
}