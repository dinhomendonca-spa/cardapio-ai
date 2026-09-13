"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  Circle,
  ImagePlus,
  Loader2,
  Maximize2,
  PackagePlus,
  Save,
  Sparkles,
} from "lucide-react";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AjusteImagem,
  useProducts,
} from "@/context/ProductContext";

import {
  useStore,
} from "@/context/StoreContext";

import {
  supabase,
} from "@/lib/supabase";

const CATEGORIAS_SUGERIDAS = [
  "Destaques",
  "Produtos",
  "Acessórios",
  "Promoções",
];

function converterPreco(
  valor: string
) {
  const limpo =
    valor.trim();

  if (
    limpo.includes(",")
  ) {
    return Number(
      limpo
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  return Number(
    limpo
  );
}

export default function NovoProdutoPage() {
  const {
    adicionarProduto,
  } = useProducts();

  const {
    loja,
  } = useStore();

  const inputImagemRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    nome,
    setNome,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState("");

  const [
    preco,
    setPreco,
  ] = useState("");

  const [
    controlarEstoque,
    setControlarEstoque,
  ] = useState(true);

  const [
    estoque,
    setEstoque,
  ] = useState("");

  const [
    ajusteImagem,
    setAjusteImagem,
  ] = useState<AjusteImagem>(
    "conter"
  );

  const [
    arquivo,
    setArquivo,
  ] =
    useState<File | null>(
      null
    );

  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    produtoSalvo,
    setProdutoSalvo,
  ] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [
    preview,
  ]);

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

      event.target.value =
        "";

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

      event.target.value =
        "";

      return;
    }

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    setArquivo(
      imagem
    );

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
      const tamanhoMaximo =
        1200;

      const qualidade =
        0.82;

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

              img.onload =
                () =>
                  resolve(
                    img
                  );

              img.onerror =
                () =>
                  reject(
                    new Error(
                      "Não foi possível processar esta imagem."
                    )
                  );

              img.src =
                urlOriginal;
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

          largura =
            Math.round(
              largura *
                proporcao
            );

          altura =
            Math.round(
              altura *
                proporcao
            );
        }

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          largura;

        canvas.height =
          altura;

        const contexto =
          canvas.getContext(
            "2d"
          );

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
                (
                  resultado
                ) => {
                  if (!resultado) {
                    reject(
                      new Error(
                        "Não foi possível comprimir a imagem."
                      )
                    );

                    return;
                  }

                  resolve(
                    resultado
                  );
                },

                "image/webp",

                qualidade
              );
            }
          );

        const nomeLimpo =
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
          [
            blob,
          ],

          `${nomeLimpo || "produto"}.webp`,

          {
            type:
              "image/webp",

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

  const fazerUploadImagem =
    async () => {
      if (!arquivo) {
        throw new Error(
          "Adicione uma foto do produto."
        );
      }

      const imagemOtimizada =
        await otimizarImagem(
          arquivo
        );

      const nomeArquivo =
        `lojas/${loja?.id ?? "sem-loja"}/produtos/${Date.now()}-${crypto.randomUUID()}.webp`;

      const {
        error,
      } =
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

              upsert:
                false,

              contentType:
                "image/webp",
            }
          );

      if (error) {
        throw error;
      }

      const {
        data,
      } =
        supabase.storage
          .from(
            "product-images"
          )
          .getPublicUrl(
            nomeArquivo
          );

      return data.publicUrl;
    };

  const precoNumerico =
    converterPreco(
      preco
    );

  const estoqueNumerico =
    Number(
      estoque
    );

  const imagemPreenchida =
    arquivo !== null;

  const nomePreenchido =
    nome.trim().length >= 2;

  const descricaoPreenchida =
    descricao.trim().length >= 5;

  const categoriaPreenchida =
    categoria.trim().length >= 2;

  const precoValido =
    Number.isFinite(
      precoNumerico
    ) &&
    precoNumerico > 0;

  const estoqueValido =
    !controlarEstoque ||
    (
      estoque.trim() !== "" &&
      Number.isInteger(
        estoqueNumerico
      ) &&
      estoqueNumerico >= 0
    );

  const itensConcluidos = [
    imagemPreenchida,
    nomePreenchido &&
      descricaoPreenchida,
    categoriaPreenchida,
    precoValido,
    estoqueValido,
  ].filter(Boolean).length;

  const formularioValido =
    itensConcluidos === 5;

  const salvarProduto =
    async () => {
      if (
        !imagemPreenchida
      ) {
        alert(
          "Adicione uma foto do produto."
        );

        return;
      }

      if (
        !nomePreenchido
      ) {
        alert(
          "Informe o nome do produto."
        );

        return;
      }

      if (
        !descricaoPreenchida
      ) {
        alert(
          "Escreva uma breve descrição do produto."
        );

        return;
      }

      if (
        !categoriaPreenchida
      ) {
        alert(
          "Informe uma categoria."
        );

        return;
      }

      if (!precoValido) {
        alert(
          "Informe um preço maior que zero."
        );

        return;
      }

      if (
        !estoqueValido
      ) {
        alert(
          "Informe uma quantidade inteira e igual ou maior que zero."
        );

        return;
      }

      try {
        setSalvando(true);

        const imagemUrl =
          await fazerUploadImagem();

        await adicionarProduto({
          nome:
            nome.trim(),

          descricao:
            descricao.trim(),

          categoria:
            categoria.trim(),

          preco:
            precoNumerico,

          estoque:
            controlarEstoque
              ? estoqueNumerico
              : 0,

          estoque_controlado:
            controlarEstoque,

          imagem:
            imagemUrl,

          ajuste_imagem:
            ajusteImagem,

          ativo:
            true,
        });

        setProdutoSalvo(
          true
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "Erro ao salvar produto:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o produto."
        );
      } finally {
        setSalvando(false);
      }
    };

  const cadastrarOutroProduto =
    () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }

      setNome("");
      setDescricao("");
      setCategoria("");
      setPreco("");
      setControlarEstoque(true);
      setEstoque("");
      setAjusteImagem(
        "conter"
      );
      setArquivo(null);
      setPreview(null);
      setProdutoSalvo(false);

      if (
        inputImagemRef.current
      ) {
        inputImagemRef.current.value =
          "";
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b18] pb-12 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-44 top-72 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020b18]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">
          <Link
            href="/admin/produtos"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
              Produtos
            </p>

            <h1 className="truncate text-lg font-black">
              Cadastrar produto
            </h1>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-500/20 to-blue-600/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500">
              <Sparkles
                size={22}
              />
            </div>

            <div>
              <h2 className="font-black">
                Cadastre um produto
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Use uma foto nítida e informações simples para facilitar a compra.
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all"
              style={{
                width:
                  `${itensConcluidos * 20}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs font-semibold text-sky-200">
            {itensConcluidos} de 5 itens concluídos
          </p>
        </section>

        {produtoSalvo ? (
          <section className="rounded-[28px] border border-emerald-400/25 bg-emerald-400/10 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check
                size={30}
              />
            </div>

            <h2 className="mt-4 text-xl font-black text-emerald-100">
              Produto cadastrado!
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Você pode cadastrar mais produtos ou consultar os itens da sua loja.
            </p>

            <button
              type="button"
              onClick={
                cadastrarOutroProduto
              }
              className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-emerald-500 px-5 font-bold"
            >
              Cadastrar outro produto

              <PackagePlus
                size={19}
              />
            </button>

            <Link
              href="/admin/produtos"
              className="mt-3 flex h-14 items-center justify-between rounded-2xl border border-white/15 bg-white/[0.06] px-5 font-bold"
            >
              Ver meus produtos

              <ArrowRight
                size={19}
              />
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <ImagePlus
                  size={21}
                  className="text-violet-300"
                />

                <div>
                  <h2 className="font-bold">
                    Foto do produto
                  </h2>

                  <p className="text-xs text-slate-400">
                    Obrigatória para publicação
                  </p>
                </div>

                {imagemPreenchida ? (
                  <Check
                    size={20}
                    className="ml-auto text-emerald-400"
                  />
                ) : (
                  <Circle
                    size={20}
                    className="ml-auto text-slate-600"
                  />
                )}
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
                className="relative mt-5 flex h-64 w-full overflow-hidden rounded-[24px] border-2 border-dashed border-violet-400/30 bg-white"
              >
                {preview ? (
                  <>
                    <Image
                      src={preview}
                      alt="Produto selecionado"
                      fill
                      className={
                        ajusteImagem ===
                        "preencher"
                          ? "object-cover"
                          : "object-contain p-2"
                      }
                      unoptimized
                    />

                    <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-2 text-xs font-bold text-white">
                      Trocar foto
                    </span>
                  </>
                ) : (
                  <div className="m-auto flex flex-col items-center px-6 text-center text-slate-400">
                    <ImagePlus
                      size={32}
                      className="text-violet-400"
                    />

                    <strong className="mt-3 text-slate-700">
                      Adicionar foto
                    </strong>

                    <span className="mt-2 text-xs leading-5">
                      Prefira uma imagem quadrada, com boa iluminação e fundo limpo
                    </span>
                  </div>
                )}
              </button>

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

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {ajusteImagem ===
                  "preencher"
                    ? "A imagem preencherá todo o card e poderá ter pequenas partes cortadas."
                    : "A imagem aparecerá inteira e poderá deixar espaços nas bordas."}
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <PackagePlus
                  size={21}
                  className="text-sky-300"
                />

                <div>
                  <h2 className="font-bold">
                    Informações
                  </h2>

                  <p className="text-xs text-slate-400">
                    Dados exibidos ao comprador
                  </p>
                </div>

                {nomePreenchido &&
                descricaoPreenchida ? (
                  <Check
                    size={20}
                    className="ml-auto text-emerald-400"
                  />
                ) : (
                  <Circle
                    size={20}
                    className="ml-auto text-slate-600"
                  />
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="nome"
                    className="mb-2 block text-xs font-bold text-slate-300"
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
                    placeholder="Ex.: Camiseta básica preta"
                    maxLength={80}
                    lang="pt-BR"
                    spellCheck={true}
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="descricao"
                    className="mb-2 block text-xs font-bold text-slate-300"
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
                    placeholder="Explique tamanho, material, características ou conteúdo."
                    rows={4}
                    maxLength={300}
                    lang="pt-BR"
                    spellCheck={true}
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4 outline-none focus:border-sky-400"
                  />

                  <p className="mt-1 text-right text-xs text-slate-500">
                    {descricao.length}/300
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <Boxes
                  size={21}
                  className="text-amber-300"
                />

                <div>
                  <h2 className="font-bold">
                    Categoria e preço
                  </h2>

                  <p className="text-xs text-slate-400">
                    Organize e defina o valor
                  </p>
                </div>

                {categoriaPreenchida &&
                precoValido ? (
                  <Check
                    size={20}
                    className="ml-auto text-emerald-400"
                  />
                ) : (
                  <Circle
                    size={20}
                    className="ml-auto text-slate-600"
                  />
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="categoria"
                  className="mb-2 block text-xs font-bold text-slate-300"
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
                  placeholder="Ex.: Camisetas"
                  maxLength={50}
                  lang="pt-BR"
                  spellCheck={true}
                  autoCorrect="on"
                  autoCapitalize="words"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-amber-400"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {CATEGORIAS_SUGERIDAS.map(
                    (
                      categoriaSugerida
                    ) => (
                      <button
                        key={
                          categoriaSugerida
                        }
                        type="button"
                        onClick={() =>
                          setCategoria(
                            categoriaSugerida
                          )
                        }
                        className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-slate-300"
                      >
                        {categoriaSugerida}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="preco"
                  className="mb-2 block text-xs font-bold text-slate-300"
                >
                  Preço
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-300">
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
                    className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] py-4 pl-12 pr-4 outline-none focus:border-emerald-400"
                  />
                </div>

                {preco.trim() &&
                !precoValido ? (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    Informe um valor maior que zero.
                  </p>
                ) : null}
              </div>
            </section>

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
                    Controle automático de disponibilidade
                  </p>
                </div>

                {estoqueValido ? (
                  <Check
                    size={20}
                    className="ml-auto text-emerald-400"
                  />
                ) : (
                  <Circle
                    size={20}
                    className="ml-auto text-slate-600"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setControlarEstoque(
                    !controlarEstoque
                  );

                  if (
                    controlarEstoque
                  ) {
                    setEstoque("");
                  }
                }}
                className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4"
              >
                <div className="pr-4 text-left">
                  <p className="font-bold">
                    Controlar estoque
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Marque para indicar quando o produto esgotar
                  </p>
                </div>

                <div
                  className={`relative h-7 w-12 shrink-0 rounded-full ${
                    controlarEstoque
                      ? "bg-cyan-500"
                      : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      controlarEstoque
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </div>
              </button>

              {controlarEstoque && (
                <div className="mt-4">
                  <label
                    htmlFor="estoque"
                    className="mb-2 block text-xs font-bold text-slate-300"
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
                    placeholder="20"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-cyan-400"
                  />
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={
                salvarProduto
              }
              disabled={
                salvando ||
                !formularioValido
              }
              className="flex h-16 w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-r from-sky-500 to-blue-600 px-5 font-black shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Otimizando e salvando...
                </>
              ) : (
                <>
                  <Save
                    size={20}
                  />

                  Salvar produto
                </>
              )}
            </button>

            {!formularioValido && (
              <p className="text-center text-xs leading-5 text-slate-500">
                Complete os cinco itens para cadastrar o produto.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}