import Link from "next/link";

import {
  ArrowRight,
  Check,
  LayoutDashboard,
  QrCode,
  ShoppingBag,
  Smartphone,
  Store,
} from "lucide-react";

const beneficios = [
  {
    titulo:
      "Loja online completa",

    descricao:
      "Produtos, categorias, carrinho e checkout em um único endereço.",

    icone:
      Store,
  },
  {
    titulo:
      "Pedidos organizados",

    descricao:
      "Receba e acompanhe os pedidos pelo painel do comerciante.",

    icone:
      LayoutDashboard,
  },
  {
    titulo:
      "Feita para o celular",

    descricao:
      "Seu cliente compra de forma simples pelo celular, tablet ou computador.",

    icone:
      Smartphone,
  },
  {
    titulo:
      "Link e QR Code",

    descricao:
      "Compartilhe sua loja nas redes sociais ou coloque o QR Code no estabelecimento.",

    icone:
      QrCode,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020b18] text-white">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-48 -top-48 h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-[130px]" />

        <div className="pointer-events-none absolute -right-48 top-64 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[130px]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/20">
                <ShoppingBag
                  size={21}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                  Visite Minha Loja
                </p>

                <p className="text-sm font-bold">
                  Venda pela internet
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold"
            >
              Entrar
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200">
              <Check
                size={16}
              />

              Sem comissão sobre suas vendas
            </div>

            <h1 className="mt-7 text-[46px] font-black leading-[0.98] tracking-tight">
              Sua loja online pronta para vender.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Cadastre seus produtos, receba pedidos e compartilhe sua loja com clientes de qualquer lugar.
            </p>

            <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                Plano mensal
              </p>

              <div className="mt-2 flex items-end gap-2">
                <strong className="text-4xl font-black">
                  R$ 59,90
                </strong>

                <span className="pb-1 text-sm text-slate-400">
                  por mês
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Sem taxa de instalação e sem comissão cobrada pelo sistema sobre os pedidos.
              </p>
            </div>

            <Link
              href="/cadastro"
              className="mt-5 flex min-h-16 items-center justify-between rounded-[22px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 text-lg font-black shadow-xl shadow-blue-500/20 transition active:scale-[0.98]"
            >
              Criar minha loja

              <ArrowRight
                size={21}
              />
            </Link>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Cadastre-se, realize o pagamento e configure sua loja pelo tutorial.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-md px-5 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Tudo em um só lugar
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Simples para você e para seus clientes
          </h2>

          <div className="mt-7 space-y-3">
            {beneficios.map(
              ({
                titulo,
                descricao,
                icone: Icone,
              }) => (
                <article
                  key={titulo}
                  className="flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.05] p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                    <Icone
                      size={21}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold">
                      {titulo}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {descricao}
                    </p>
                  </div>
                </article>
              )
            )}
          </div>

          <Link
            href="/cadastro"
            className="mt-7 flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-white px-5 font-black text-slate-950"
          >
            Começar agora

            <ArrowRight
              size={19}
            />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-md px-5 py-8 text-center">
          <p className="text-sm font-bold">
            Visite Minha Loja
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Sua loja online, simples e acessível.
          </p>
        </div>
      </footer>
    </main>
  );
}