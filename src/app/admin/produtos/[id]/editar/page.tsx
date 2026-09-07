"use client";

import Image from "next/image";

import {
  ArrowLeft,
  Boxes,
  ImagePlus,
  Loader2,
  Save,
} from "lucide-react";

import Link from "next/link";

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
  ativo: boolean;
};

export default function EditarProdutoPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const inputImagemRef =
    useRef<HTMLInputElement>(null);

  const [produto, setProduto] =
    useState<Produto | null>(null);

  const [nome, setNome] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [preco, setPreco] =
    useState("");

  const [estoque, setEstoque] =
    useState("");

  const [
    estoqueControlado,
    setEstoqueControlado,
  ] = useState(true);

  const [imagemAtual, setImagemAtual] =
    useState("");

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    const carregarProduto = async () => {
      try {
        setCarregando(true);

        const { data, error } =
          await supabase
            .from("produtos")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
          throw error || new Error(
            "Produto não encontrado."
          );
        }

        const produtoCarregado: Produto = {
          id: Number(data.id),

          nome:
            data.nome ?? "",

          descricao:
            data.descricao ?? "",

          categoria:
            data.categoria ?? "",

          preco:
            Number(data.preco ?? 0),

          estoque:
            Number(data.estoque ?? 0),

          estoque_controlado:
            data.estoque_controlado ?? true,

          imagem:
            data.imagem ??
            "/images/logo.png",

          ativo:
            data.ativo ?? true,
        };

        setProduto(produtoCarregado);

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
          produtoCarregado.estoque_controlado
        );

        setImagemAtual(
          produtoCarregado.imagem
        );
      } catch (error) {
        console.error(
          "Erro ao carregar produto:",
          error
        );

        alert(
          "Produto não encontrado."
        );

        router.push(
          "/admin/produtos"
        );
      } finally {
        setCarregando(false);
      }
    };

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      carregarProduto();
    } else {
      alert(
        "Produto inválido."
      );

      router.push(
        "/admin/produtos"
      );
    }
  }, [id, router]);

  const selecionarImagem = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const imagem =
      event.target.files?.[0];

    if (!imagem) {
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

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  const abrirSeletorImagem = () => {
    inputImagemRef.current?.click();
  };

  const fazerUploadNovaImagem =
    async () => {
      if (!arquivo) {
        return imagemAtual;
      }

      const extensao =
        arquivo.name
          .split(".")
          .pop() || "jpg";

      const nomeArquivo =
        `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

      const { error } =
        await supabase.storage
          .from("product-images")
          .upload(
            nomeArquivo,
            arquivo,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from("product-images")
          .getPublicUrl(
            nomeArquivo
          );

      return data.publicUrl;
    };

  const salvarProduto =
    async () => {
      const precoNumerico =
        Number(
          preco.replace(
            ",",
            "."
          )
        );

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
        Number.isNaN(precoNumerico) ||
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
          Number.isNaN(
            estoqueNumerico
          ) ||
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
              nome:
                nome.trim(),

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

              imagem:
                imagemUrl,
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        router.push(
          "/admin/produtos"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Erro ao editar produto:",
          error
        );

        alert(
          "Não foi possível editar o produto."
        );
      } finally {
        setSalvando(false);
      }
    };

  if (
    carregando ||
    !produto
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2
          className="animate-spin"
          size={28}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">

          <Link
            href="/admin/produtos"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div>
            <p className="text-xs text-zinc-500">
              Produtos
            </p>

            <h1 className="text-lg font-bold">
              Editar produto
            </h1>
          </div>

        </div>

      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">

        {/* FOTO */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="font-bold">
            Foto do produto
          </h2>

          <input
            ref={inputImagemRef}
            type="file"
            accept="image/*"
            onChange={
              selecionarImagem
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={
              abrirSeletorImagem
            }
            className="relative mt-4 flex min-h-44 w-full overflow-hidden rounded-3xl border-2 border-dashed border-zinc-200"
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
              className="object-cover"
              unoptimized={
                Boolean(preview)
              }
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100">

              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold">

                <ImagePlus
                  size={18}
                />

                Trocar imagem

              </div>

            </div>

          </button>

          <p className="mt-3 text-center text-xs text-zinc-500">
            Toque na imagem para trocar
          </p>

        </section>

        {/* INFORMAÇÕES */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="font-bold">
            Informações
          </h2>

          <div className="mt-4 space-y-4">

            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold"
              >
                Nome do produto
              </label>

              <input
                id="nome"
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }
                placeholder="Nome do produto"
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="descricao"
                className="mb-2 block text-sm font-semibold"
              >
                Descrição
              </label>

              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value
                  )
                }
                placeholder="Descrição"
                rows={4}
                className="w-full resize-none rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="categoria"
                className="mb-2 block text-sm font-semibold"
              >
                Categoria
              </label>

              <input
                id="categoria"
                value={categoria}
                onChange={(e) =>
                  setCategoria(
                    e.target.value
                  )
                }
                placeholder="Ex: Cabos, Capinhas, Fones..."
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="preco"
                className="mb-2 block text-sm font-semibold"
              >
                Preço
              </label>

              <input
                id="preco"
                value={preco}
                onChange={(e) =>
                  setPreco(
                    e.target.value
                  )
                }
                placeholder="Ex: 49,90"
                inputMode="decimal"
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

          </div>

        </section>

        {/* ESTOQUE */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">

              <Boxes
                size={20}
              />

            </div>

            <div>
              <h2 className="font-bold">
                Controle de estoque
              </h2>

              <p className="mt-1 text-sm leading-5 text-zinc-500">
                Controle a quantidade disponível deste produto.
              </p>
            </div>

          </div>

          <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl bg-zinc-100 p-4">

            <div>
              <p className="text-sm font-bold">
                Controlar estoque
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Ative para limitar as vendas pela quantidade disponível.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                estoqueControlado
              }
              onChange={(e) =>
                setEstoqueControlado(
                  e.target.checked
                )
              }
              className="h-5 w-5 accent-zinc-950"
            />

          </label>

          {estoqueControlado && (
            <div className="mt-4">

              <label
                htmlFor="estoque"
                className="mb-2 block text-sm font-semibold"
              >
                Quantidade disponível
              </label>

              <input
                id="estoque"
                type="number"
                value={estoque}
                onChange={(e) =>
                  setEstoque(
                    e.target.value
                  )
                }
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Ex: 20"
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 text-lg font-semibold outline-none"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Quando chegar a 0, o produto poderá ser marcado como esgotado na loja.
              </p>

            </div>
          )}

          {!estoqueControlado && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                Estoque não controlado
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                O produto poderá ser vendido sem limite de quantidade.
              </p>

            </div>
          )}

        </section>

        {/* SALVAR */}
        <button
          type="button"
          onClick={
            salvarProduto
          }
          disabled={
            salvando
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
        >

          {salvando ? (
            <>
              <Loader2
                size={19}
                className="animate-spin"
              />

              Salvando...
            </>
          ) : (
            <>
              <Save
                size={19}
              />

              Salvar alterações
            </>
          )}

        </button>

      </section>

    </main>
  );
}