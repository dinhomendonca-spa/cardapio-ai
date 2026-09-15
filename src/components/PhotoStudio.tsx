"use client";

import {
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Scissors,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Formato = "quadrado" | "stories";

type PhotoStudioProps = {
  aberto: boolean;
  imagem: string;
  nomeArquivo?: string;
  aoFechar: () => void;
  aoAplicar: (arquivo: File) => void;
};

const FUNDOS = [
  { nome: "Branco", cor: "#ffffff" },
  { nome: "Marfim", cor: "#f8f3ea" },
  { nome: "Rosé", cor: "#f3e3e2" },
  { nome: "Cinza", cor: "#ececee" },
  { nome: "Preto", cor: "#111111" },
];

function carregarImagem(origem: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagem = new window.Image();
    imagem.crossOrigin = "anonymous";
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () =>
      reject(new Error("Não foi possível abrir esta imagem no estúdio."));
    imagem.src = origem;
  });
}

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function distanciaDeCor(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) {
  return Math.sqrt(
    (r1 - r2) ** 2 +
      (g1 - g2) ** 2 +
      (b1 - b2) ** 2
  );
}

function removerFundoUniforme(
  contexto: CanvasRenderingContext2D,
  largura: number,
  altura: number,
  intensidade: number,
  area: {
    x: number;
    y: number;
    largura: number;
    altura: number;
  }
) {
  const pixels = contexto.getImageData(0, 0, largura, altura);
  const dados = pixels.data;
  const esquerda = limitar(Math.round(area.x + 2), 2, largura - 3);
  const direita = limitar(
    Math.round(area.x + area.largura - 3),
    2,
    largura - 3
  );
  const topo = limitar(Math.round(area.y + 2), 2, altura - 3);
  const base = limitar(
    Math.round(area.y + area.altura - 3),
    2,
    altura - 3
  );
  const amostras = [
    [esquerda, topo],
    [direita, topo],
    [esquerda, base],
    [direita, base],
  ];

  let fundoR = 0;
  let fundoG = 0;
  let fundoB = 0;

  amostras.forEach(([x, y]) => {
    const indice = (y * largura + x) * 4;
    fundoR += dados[indice];
    fundoG += dados[indice + 1];
    fundoB += dados[indice + 2];
  });

  fundoR /= amostras.length;
  fundoG /= amostras.length;
  fundoB /= amostras.length;

  const limite = 24 + intensidade * 0.9;
  const suavidade = 34;

  for (let indice = 0; indice < dados.length; indice += 4) {
    const distancia = distanciaDeCor(
      dados[indice],
      dados[indice + 1],
      dados[indice + 2],
      fundoR,
      fundoG,
      fundoB
    );

    if (distancia <= limite) {
      dados[indice + 3] = 0;
    } else if (distancia < limite + suavidade) {
      const alpha = (distancia - limite) / suavidade;
      dados[indice + 3] = Math.round(
        dados[indice + 3] * limitar(alpha, 0, 1)
      );
    }
  }

  contexto.putImageData(pixels, 0, 0);
}

export default function PhotoStudio({
  aberto,
  imagem,
  nomeArquivo = "produto",
  aoFechar,
  aoAplicar,
}: PhotoStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [formato, setFormato] = useState<Formato>("quadrado");
  const [fundo, setFundo] = useState("#ffffff");
  const [brilho, setBrilho] = useState(100);
  const [contraste, setContraste] = useState(100);
  const [saturacao, setSaturacao] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [removerFundo, setRemoverFundo] = useState(false);
  const [intensidade, setIntensidade] = useState(35);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const desenhar = useCallback(async () => {
    if (!aberto || !imagem || !canvasRef.current) return;

    try {
      setProcessando(true);
      setErro("");

      const original = await carregarImagem(imagem);
      const canvas = canvasRef.current;
      const largura = 1080;
      const altura = formato === "quadrado" ? 1080 : 1920;
      canvas.width = largura;
      canvas.height = altura;

      const contexto = canvas.getContext("2d", {
        willReadFrequently: removerFundo,
      });
      if (!contexto) throw new Error("Seu navegador não abriu o editor.");

      const camada = document.createElement("canvas");
      camada.width = largura;
      camada.height = altura;
      const contextoCamada = camada.getContext("2d", {
        willReadFrequently: removerFundo,
      });
      if (!contextoCamada) throw new Error("Não foi possível preparar a foto.");

      const margem = formato === "quadrado" ? 90 : 130;
      const escalaBase = Math.min(
        (largura - margem * 2) / original.naturalWidth,
        (altura - margem * 2) / original.naturalHeight
      );
      const escala = escalaBase * (zoom / 100);
      const fotoLargura = original.naturalWidth * escala;
      const fotoAltura = original.naturalHeight * escala;
      const x = (largura - fotoLargura) / 2;
      const y = (altura - fotoAltura) / 2;

      contextoCamada.filter = `brightness(${brilho}%) contrast(${contraste}%) saturate(${saturacao}%)`;
      contextoCamada.imageSmoothingEnabled = true;
      contextoCamada.imageSmoothingQuality = "high";
      contextoCamada.drawImage(
        original,
        x,
        y,
        fotoLargura,
        fotoAltura
      );
      contextoCamada.filter = "none";

      if (removerFundo) {
        removerFundoUniforme(
          contextoCamada,
          largura,
          altura,
          intensidade,
          {
            x,
            y,
            largura: fotoLargura,
            altura: fotoAltura,
          }
        );
      }

      contexto.fillStyle = fundo;
      contexto.fillRect(0, 0, largura, altura);

      if (removerFundo) {
        contexto.save();
        contexto.shadowColor = "rgba(15, 23, 42, 0.22)";
        contexto.shadowBlur = 32;
        contexto.shadowOffsetY = 18;
        contexto.drawImage(camada, 0, 0);
        contexto.restore();
      } else {
        contexto.drawImage(camada, 0, 0);
      }
    } catch (error) {
      console.error("Erro no estúdio de fotos:", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a imagem."
      );
    } finally {
      setProcessando(false);
    }
  }, [
    aberto,
    imagem,
    formato,
    fundo,
    brilho,
    contraste,
    saturacao,
    zoom,
    removerFundo,
    intensidade,
  ]);

  useEffect(() => {
    const temporizador = window.setTimeout(desenhar, 80);
    return () => window.clearTimeout(temporizador);
  }, [desenhar]);

  useEffect(() => {
    if (!aberto) return;
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") aoFechar();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberto, aoFechar]);

  const restaurar = () => {
    setFormato("quadrado");
    setFundo("#ffffff");
    setBrilho(100);
    setContraste(100);
    setSaturacao(100);
    setZoom(100);
    setRemoverFundo(false);
    setIntensidade(35);
  };

  const criarArquivo = () =>
    new Promise<File>((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error("A imagem ainda não está pronta."));
        return;
      }
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Não foi possível salvar a imagem."));
            return;
          }
          const base = nomeArquivo
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "-");
          resolve(
            new File([blob], `${base || "produto"}-estudio.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            })
          );
        },
        "image/webp",
        0.9
      );
    });

  const aplicar = async () => {
    try {
      setProcessando(true);
      const arquivo = await criarArquivo();
      aoAplicar(arquivo);
      aoFechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível aplicar.");
    } finally {
      setProcessando(false);
    }
  };

  const baixar = async () => {
    try {
      const arquivo = await criarArquivo();
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = arquivo.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível baixar.");
    }
  };

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#090710]/95 text-white backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Estúdio de fotos"
    >
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#090710]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-lg shadow-fuchsia-950/40">
              <Sparkles size={21} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                Gratuito
              </p>
              <h2 className="font-black">Estúdio de Fotos</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
            aria-label="Fechar estúdio"
          >
            <X size={21} />
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1.25fr)_360px]">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-3 sm:p-5">
          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(45deg,#252331_25%,transparent_25%),linear-gradient(-45deg,#252331_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#252331_75%),linear-gradient(-45deg,transparent_75%,#252331_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] p-3">
            <canvas
              ref={canvasRef}
              className={`max-h-[68vh] max-w-full rounded-xl object-contain shadow-2xl ${
                formato === "stories" ? "aspect-[9/16]" : "aspect-square"
              }`}
            />
            {processando ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <Loader2 className="animate-spin text-rose-300" size={34} />
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-slate-400">
            Tudo é processado no seu aparelho, sem consumir créditos de IA.
          </p>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
            <p className="text-sm font-black">Formato</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormato("quadrado")}
                className={`rounded-2xl border px-3 py-3 text-xs font-bold ${
                  formato === "quadrado"
                    ? "border-rose-400 bg-rose-400/15 text-rose-200"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                Loja / Feed 1:1
              </button>
              <button
                type="button"
                onClick={() => setFormato("stories")}
                className={`rounded-2xl border px-3 py-3 text-xs font-bold ${
                  formato === "stories"
                    ? "border-rose-400 bg-rose-400/15 text-rose-200"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                Stories 9:16
              </button>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center gap-2">
              <Scissors size={18} className="text-rose-300" />
              <p className="text-sm font-black">Fundo automático</p>
              <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-black text-amber-200">
                BETA
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRemoverFundo((valor) => !valor)}
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-left"
            >
              <span className="text-xs font-bold">Remover fundo uniforme</span>
              <span
                className={`relative h-7 w-12 rounded-full transition ${
                  removerFundo ? "bg-rose-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    removerFundo ? "left-6" : "left-1"
                  }`}
                />
              </span>
            </button>
            {removerFundo ? (
              <label className="mt-3 block text-xs font-bold text-slate-300">
                Intensidade: {intensidade}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensidade}
                  onChange={(event) => setIntensidade(Number(event.target.value))}
                  className="mt-2 w-full accent-rose-500"
                />
              </label>
            ) : null}
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Funciona melhor quando a peça está sobre uma parede ou superfície de cor uniforme.
            </p>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-violet-300" />
              <p className="text-sm font-black">Fundo da vitrine</p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {FUNDOS.map((opcao) => (
                <button
                  key={opcao.cor}
                  type="button"
                  onClick={() => setFundo(opcao.cor)}
                  title={opcao.nome}
                  aria-label={`Fundo ${opcao.nome}`}
                  className={`aspect-square rounded-xl border-2 ${
                    fundo === opcao.cor ? "border-rose-400" : "border-white/10"
                  }`}
                  style={{ backgroundColor: opcao.cor }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
            {[
              ["Brilho", brilho, setBrilho, 60, 140],
              ["Contraste", contraste, setContraste, 60, 140],
              ["Cor", saturacao, setSaturacao, 0, 160],
              ["Enquadramento", zoom, setZoom, 70, 150],
            ].map(([rotulo, valor, alterar, minimo, maximo]) => (
              <label key={String(rotulo)} className="block text-xs font-bold text-slate-300">
                <span className="flex justify-between">
                  <span>{String(rotulo)}</span>
                  <span className="text-slate-500">{Number(valor)}%</span>
                </span>
                <input
                  type="range"
                  min={Number(minimo)}
                  max={Number(maximo)}
                  value={Number(valor)}
                  onChange={(event) =>
                    (alterar as (valor: number) => void)(Number(event.target.value))
                  }
                  className="mt-2 w-full accent-rose-500"
                />
              </label>
            ))}
          </section>

          {erro ? (
            <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-5 text-red-200">
              {erro}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={restaurar}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300"
            >
              <RotateCcw size={16} /> Restaurar
            </button>
            <button
              type="button"
              onClick={baixar}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300"
            >
              <Download size={16} /> Baixar
            </button>
          </div>

          <button
            type="button"
            onClick={aplicar}
            disabled={processando || Boolean(erro)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-black shadow-lg shadow-fuchsia-950/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ? <Loader2 size={19} className="animate-spin" /> : <Check size={19} />}
            Usar esta foto no produto
          </button>
        </aside>
      </div>
    </div>
  );
}
