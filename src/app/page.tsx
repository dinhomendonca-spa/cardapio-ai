import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-200">
            <ShoppingBag size={16} />

            <span>
              Pedidos online sem comissão
            </span>
          </div>

          <h1 className="mt-7 text-[48px] font-extrabold leading-[0.98] tracking-tight">
            Seu comércio
            <br />
            vendendo online de
            <br />
            forma simples.
          </h1>

          <p className="mt-7 max-w-sm text-[18px] leading-8 text-zinc-400">
           Loja online, carrinho, Pix e pedido pronto para o WhatsApp.
          </p>

          <Link
            href="/menu"
            className="mt-9 inline-flex min-h-14 items-center justify-center gap-4 rounded-2xl bg-white px-6 text-base font-bold text-black shadow-lg transition active:scale-95"
          >
            Conhecer loja

            <ArrowRight size={19} />
          </Link>
        </div>
      </section>
    </main>
  );
}