"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  ImagePlus,
  Loader2,
  Maximize2,
  Move,
  Pencil,
  Save,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AjusteImagem,
} from "@/context/ProductContext";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  estoque: number;
  estoque_controlado: boolean;
  imagem: string;
  ajuste_imagem: AjusteImagem;
  imagem_posicao_x: number;
  imagem_posicao_y: number;
  ativo: boolean;
};

function normalizarAjusteImagem(
  valor: unknown
): AjusteImagem {
  return valor === "preencher"
    ? "preencher"
    : "conter";
}

function converterPreco(
  valor: string
) {
  const limpo = valor.trim();

  if (limpo.includes(",")) {
    return Number(
      limpo
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  return Number(limpo);
}

export default function EditarProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const inputImagemRef =
    useRef<HTMLInputElement>(null);

  const [
    produto,
    setProduto,
  ] = useState<Produto | null>(null);

  const [nome, setNome] =
    useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState("");

  const [preco, setPreco] =
    useState("");

  const [estoque, setEstoque] =
    useState("");

  const [
    estoqueControlado,
    setEstoqueControlado,
  ] = useState(true);

  const [ativo, setAtivo] =
    useState(true);

  const [
    ajusteImagem,
    setAjusteImagem,
  ] = useState<AjusteImagem>(
    "conter"
  );

  const [
    imagemAtual,
    setImagemAtual,
  ] = useState("");

  const [imagemPosicaoX, setImagemPosicaoX] =
    useState(50);

  const [imagemPosicaoY, setImagemPosicaoY] =
    useState(50);

  const [
    arquivo,
    setArquivo,
  ] = useState<File | null>(null);

  const [
    preview,
    setPreview,
  ] = useState<string | null>(null);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const carregarProduto =
      async () => {
        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          alert(
            "Produto inválido."
          );

          router.replace(
            "/admin/produtos"
          );

          return;
        }

        try {
          setCarregando(true);

          const {
            data,
            error,
          } = await supabase
            .from("produtos")
            .select("*")
            .eq("id", id)
            .single();

          if (error || !data) {
            throw (
              error ||
              new Error(
                "Produto não encontrado."
              )
            );
          }

          if (cancelado) {
            return;
          }

          const produtoCarregado: Produto =
            {
              id: Number(data.id),

              nome:
                data.nome ?? "",

              descricao:
                data.descricao ?? "",

              categoria:
                data.categoria ?? "",

              preco: Number(
                data.preco ?? 0
              ),

              estoque: Number(
                data.estoque ?? 0
              ),

              estoque_controlado:
                data.estoque_controlado ??
                true,

              imagem:
                data.imagem ??
                "/images/logo.png",

              ajuste_imagem:
                normalizarAjusteImagem(
                  data.ajuste_imagem
                ),

              imagem_posicao_x:
                Number(data.imagem_posicao_x ?? 50),

              imagem_posicao_y:
                Number(data.imagem_posicao_y ?? 50),

              ativo:
                data.ativo ?? true,
            };

          setProduto(
            produtoCarregado
          );

          setNome(
            produtoCarregado.nome
          );

          setDescricao(
            produtoCarregado.descricao
          );

          setCategoria(
            produtoCarregado.categoria
          );

          setPreco(
            String(
              produtoCarregado.preco
            ).replace(".", ",")
          );

          setEstoque(
            String(
              produtoCarregado.estoque
            )
          );

          setEstoqueControlado(
            produtoCarregado
              .estoque_controlado
          );

          setImagemAtual(
            produtoCarregado.imagem
          );

          setAjusteImagem(
            produtoCarregado
              .ajuste_imagem
          );

          setImagemPosicaoX(
            produtoCarregado.imagem_posicao_x
          );

          setImagemPosicaoY(
            produtoCarregado.imagem_posicao_y
          );

          setAtivo(
            produtoCarregado.ativo
          );
        } catch (error) {
          console.error(
            "Erro ao carregar produto:",
            error
          );

          alert(
            "Produto não encontrado."
          );

          router.replace(
            "/admin/produtos"
          );
        } finally {
          if (!cancelado) {
            setCarregando(false);
          }
        }
      };

    carregarProduto();

    return () => {
      cancelado = true;
    };
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  const selecionarImagem = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const imagem =
      event.target.files?.[0];

    if (!imagem) {
      return;
    }

    if (
      !imagem.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Selecione um arquivo de imagem."
      );

      event.target.value = "";
      return;
    }

    const tamanhoMaximo =
      15 * 1024 * 1024;

    if (
      imagem.size >
      tamanhoMaximo
    ) {
      alert(
        "A imagem deve ter no máximo 15 MB."
      );

      event.target.value = "";
      return;
    }

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    setArquivo(imagem);

    setPreview(
      URL.createObjectURL(
        imagem
      )
    );
  };

  const otimizarImagem =
    async (
      arquivoOriginal: File
    ): Promise<File> => {
      const tamanhoMaximo = 1200;
      const qualidade = 0.82;

      const urlOriginal =
        URL.createObjectURL(
          arquivoOriginal
        );

      try {
        const imagem =
          await new Promise<HTMLImageElement>(
            (
              resolve,
              reject
            ) => {
              const img =
                new window.Image();

              img.onload = () =>
                resolve(img);

              img.onerror = () =>
                reject(
                  new Error(
                    "Não foi possível processar a imagem."
                  )
                );

              img.src = urlOriginal;
            }
          );

        let largura =
          imagem.naturalWidth;

        let altura =
          imagem.naturalHeight;

        if (
          largura <= 0 ||
          altura <= 0
        ) {
          throw new Error(
            "Dimensões da imagem inválidas."
          );
        }

        if (
          largura >
            tamanhoMaximo ||
          altura >
            tamanhoMaximo
        ) {
          const proporcao =
            Math.min(
              tamanhoMaximo /
                largura,
              tamanhoMaximo /
                altura
            );

          largura = Math.round(
            largura * proporcao
          );

          altura = Math.round(
            altura * proporcao
          );
        }

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width = largura;
        canvas.height = altura;

        const contexto =
          canvas.getContext("2d");

        if (!contexto) {
          throw new Error(
            "Não foi possível preparar a imagem."
          );
        }

        contexto.fillStyle =
          "#ffffff";

        contexto.fillRect(
          0,
          0,
          largura,
          altura
        );

        contexto.imageSmoothingEnabled =
          true;

        contexto.imageSmoothingQuality =
          "high";

        contexto.drawImage(
          imagem,
          0,
          0,
          largura,
          altura
        );

        const blob =
          await new Promise<Blob>(
            (
              resolve,
              reject
            ) => {
              canvas.toBlob(
                (resultado) => {
                  if (!resultado) {
                    reject(
                      new Error(
                        "Não foi possível comprimir a imagem."
                      )
                    );

                    return;
                  }

                  resolve(resultado);
                },
                "image/webp",
                qualidade
              );
            }
          );

        const nomeSemExtensao =
          arquivoOriginal.name
            .replace(
              /\.[^/.]+$/,
              ""
            )
            .replace(
              /[^a-zA-Z0-9-_]/g,
              "-"
            );

        return new File(
          [blob],
          `${
            nomeSemExtensao ||
            "produto"
          }.webp`,
          {
            type: "image/webp",
            lastModified:
              Date.now(),
          }
        );
      } finally {
        URL.revokeObjectURL(
          urlOriginal
        );
      }
    };

  const fazerUploadNovaImagem =
    async () => {
      if (!arquivo) {
        return imagemAtual;
      }

      const imagemOtimizada =
        await otimizarImagem(
          arquivo
        );

      const nomeArquivo =
        `produtos/${id}/${Date.now()}-${crypto.randomUUID()}.webp`;

      const { error } =
        await supabase.storage
          .from(
            "product-images"
          )
          .upload(
            nomeArquivo,
            imagemOtimizada,
            {
              cacheControl:
                "31536000",

              upsert: false,

              contentType:
                "image/webp",
            }
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from(
            "product-images"
          )
          .getPublicUrl(
            nomeArquivo
          );

      return data.publicUrl;
    };

  const salvarProduto =
    async () => {
      const precoNumerico =
        converterPreco(preco);

      const estoqueNumerico =
        Number(estoque);

      if (!nome.trim()) {
        alert(
          "Preencha o nome do produto."
        );
        return;
      }

      if (!categoria.trim()) {
        alert(
          "Preencha a categoria do produto."
        );
        return;
      }

      if (
        !Number.isFinite(
          precoNumerico
        ) ||
        precoNumerico <= 0
      ) {
        alert(
          "Informe um preço válido."
        );
        return;
      }

      if (
        estoqueControlado &&
        (
          estoque.trim() === "" ||
          !Number.isInteger(
            estoqueNumerico
          ) ||
          estoqueNumerico < 0
        )
      ) {
        alert(
          "Informe uma quantidade de estoque válida."
        );
        return;
      }

      try {
        setSalvando(true);

        const imagemUrl =
          await fazerUploadNovaImagem();

        const { error } =
          await supabase
            .from("produtos")
            .update({
              nome: nome.trim(),

              descricao:
                descricao.trim(),

              categoria:
                categoria.trim(),

              preco:
                precoNumerico,

              estoque:
                estoqueControlado
                  ? estoqueNumerico
                  : 0,

              estoque_controlado:
                estoqueControlado,

              imagem: imagemUrl,

              ajuste_imagem:
                ajusteImagem,

              imagem_posicao_x:
                imagemPosicaoX,

              imagem_posicao_y:
                imagemPosicaoY,

              ativo,
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.replace(
          "/admin/produtos"
        );
      } catch (error) {
        console.error(
          "Erro ao editar produto:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Não foi possível editar o produto."
        );

        setSalvando(false);
      }
    };

  if (
    carregando ||
    !produto
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] text-white">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-3 text-sm text-slate-400">
            Carregando produto...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b18] pb-12 text-white">
      {/* FUNDO DECORATIVO */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-44 top-72 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      {/* CABEÇALHO */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020b18]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">
          <Link
            href="/admin/produtos"
            replace
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
              Produtos
            </p>

            <h1 className="text-lg font-black">
              Editar produto
            </h1>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="relative z-10 mx-auto max-w-md space-y-5 px-4 py-5">
        {/* APRESENTAÇÃO */}
        <section className="rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-500/20 to-blue-600/10 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600">
              <Pencil size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-black">
                {produto.nome}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Atualize as informações do produto.
              </p>
            </div>
          </div>
        </section>

        {/* FOTO */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <ImagePlus
              size={21}
              className="text-sky-300"
            />

            <div>
              <h2 className="font-bold">
                Foto do produto
              </h2>

              <p className="text-xs text-slate-400">
                Toque na imagem para trocar
              </p>
            </div>
          </div>

          <input
            ref={inputImagemRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={
              selecionarImagem
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              inputImagemRef
                .current
                ?.click()
            }
            className="relative mt-4 flex h-64 w-full overflow-hidden rounded-[24px] border border-white/10 bg-white"
          >
            <Image
              src={
                preview ||
                imagemAtual
              }
              alt={
                nome ||
                "Produto"
              }
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              className={
                ajusteImagem ===
                "preencher"
                  ? "object-cover"
                  : "object-contain p-2"
              }
              style={{
                objectPosition: `${imagemPosicaoX}% ${imagemPosicaoY}%`,
              }}
              unoptimized={
                Boolean(preview)
              }
            />

            <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-2 text-xs font-bold">
              Trocar imagem
            </span>
          </button>

          {arquivo && (
            <p className="mt-3 rounded-2xl bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-300">
              A nova foto será redimensionada e comprimida automaticamente.
            </p>
          )}

          {/* AJUSTE DA IMAGEM */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-start gap-3">
              <Maximize2
                size={20}
                className="mt-0.5 shrink-0 text-sky-300"
              />

              <div>
                <p className="font-bold">
                  Ajuste da imagem
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Escolha como a foto aparecerá na vitrine.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setAjusteImagem(
                    "conter"
                  )
                }
                className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${
                  ajusteImagem ===
                  "conter"
                    ? "border-sky-400 bg-sky-400/15 text-sky-200"
                    : "border-white/10 bg-white/[0.04] text-slate-400"
                }`}
              >
                Mostrar inteira
              </button>

              <button
                type="button"
                onClick={() =>
                  setAjusteImagem(
                    "preencher"
                  )
                }
                className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${
                  ajusteImagem ===
                  "preencher"
                    ? "border-sky-400 bg-sky-400/15 text-sky-200"
                    : "border-white/10 bg-white/[0.04] text-slate-400"
                }`}
              >
                Preencher espaço
              </button>
            </div>

            {ajusteImagem === "preencher" && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2">
                  <Move size={17} className="text-sky-300" />
                  <p className="text-xs font-bold">Posicionar a imagem</p>
                </div>

                <label className="mt-4 block text-xs text-slate-400">
                  Horizontal
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imagemPosicaoX}
                    onChange={(event) => setImagemPosicaoX(Number(event.target.value))}
                    className="mt-2 w-full accent-sky-500"
                  />
                </label>

                <label className="mt-3 block text-xs text-slate-400">
                  Vertical
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imagemPosicaoY}
                    onChange={(event) => setImagemPosicaoY(Number(event.target.value))}
                    className="mt-2 w-full accent-sky-500"
                  />
                </label>
              </div>
            )}

            <p className="mt-3 text-xs leading-5 text-slate-500">
              {ajusteImagem ===
              "preencher"
                ? "A foto preencherá o card e poderá ter pequenas partes cortadas."
                : "A foto aparecerá inteira e poderá deixar espaços nas bordas."}
            </p>
          </div>
        </section>

        {/* INFORMAÇÕES */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <h2 className="font-black">
            Informações
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Dados exibidos para o cliente.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Nome do produto
              </label>

              <input
                id="nome"
                value={nome}
                onChange={(event) =>
                  setNome(
                    event.target.value
                  )
                }
                placeholder="Nome do produto"
                lang="pt-BR"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 outline-none transition placeholder:text-slate-500 focus:border-sky-400"
              />
            </div>

            <div>
              <label
                htmlFor="descricao"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Descrição
              </label>

              <textarea
                id="descricao"
                value={descricao}
                onChange={(event) =>
                  setDescricao(
                    event.target.value
                  )
                }
                placeholder="Descrição"
                rows={4}
                lang="pt-BR"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 outline-none transition placeholder:text-slate-500 focus:border-sky-400"
              />
            </div>

            <div>
              <label
                htmlFor="categoria"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Categoria
              </label>

              <input
                id="categoria"
                value={categoria}
                onChange={(event) =>
                  setCategoria(
                    event.target.value
                  )
                }
                placeholder="Ex.: Cabos, capinhas, fones..."
                lang="pt-BR"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="words"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 outline-none transition placeholder:text-slate-500 focus:border-sky-400"
              />
            </div>

            <div>
              <label
                htmlFor="preco"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Preço
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-sky-300">
                  R$
                </span>

                <input
                  id="preco"
                  value={preco}
                  onChange={(event) =>
                    setPreco(
                      event.target.value
                    )
                  }
                  placeholder="49,90"
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-4 pl-12 pr-4 outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ESTOQUE */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Boxes
              size={21}
              className="text-cyan-300"
            />

            <div>
              <h2 className="font-bold">
                Estoque
              </h2>

              <p className="text-xs text-slate-400">
                Controle de disponibilidade
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEstoqueControlado(
                !estoqueControlado
              );

              if (estoqueControlado) {
                setEstoque("");
              } else if (
                estoque.trim() === ""
              ) {
                setEstoque("0");
              }
            }}
            className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4"
          >
            <div className="pr-4 text-left">
              <p className="font-bold">
                Controlar estoque
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Indica quando o produto estiver esgotado
              </p>
            </div>

            <div
              className={`relative h-7 w-12 shrink-0 rounded-full ${
                estoqueControlado
                  ? "bg-cyan-500"
                  : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  estoqueControlado
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </div>
          </button>

          {estoqueControlado && (
            <div className="mt-4">
              <label
                htmlFor="estoque"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Quantidade disponível
              </label>

              <input
                id="estoque"
                type="number"
                value={estoque}
                onChange={(event) =>
                  setEstoque(
                    event.target.value
                  )
                }
                min="0"
                step="1"
                inputMode="numeric"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 outline-none transition focus:border-cyan-400"
              />
            </div>
          )}
        </section>

        {/* DISPONIBILIDADE */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <button
            type="button"
            onClick={() =>
              setAtivo(!ativo)
            }
            className="flex w-full items-center justify-between"
          >
            <div className="pr-4 text-left">
              <p className="font-bold">
                Produto disponível
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Produtos desativados não aparecem na loja
              </p>
            </div>

            <div
              className={`relative h-7 w-12 shrink-0 rounded-full ${
                ativo
                  ? "bg-emerald-500"
                  : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  ativo
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </div>
          </button>
        </section>

        {/* SALVAR */}
        <button
          type="button"
          onClick={
            salvarProduto
          }
          disabled={salvando}
          className="flex min-h-16 w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-r from-sky-500 to-blue-600 px-5 font-black shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvando ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />

              Salvando alterações...
            </>
          ) : (
            <>
              <Save size={20} />
              Salvar alterações
            </>
          )}
        </button>
      </section>
    </main>
  );
}
