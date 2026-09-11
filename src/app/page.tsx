import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleCheck,
  LayoutDashboard,
  MessageCircle,
  PackageCheck,
  QrCode,
  ShoppingBag,
  Smartphone,
  Store,
} from "lucide-react";

const etapas = [
  {
    titulo: "Crie sua loja",
    descricao:
      "Faça seu cadastro, confirme o e-mail e ative sua assinatura para acessar o painel.",
    imagem: "/images/etapa-painel.png",
    alt: "Painel do comerciante com acesso aos dados da loja e produtos",
  },
  {
    titulo: "Configure do seu jeito",
    descricao:
      "Cadastre produtos, horários, Pix e opções de entrega. Tudo organizado no seu painel.",
    imagem: "/images/etapa-configuracao.png",
    alt: "Opções de configuração de produtos, pedidos, QR Code, pagamento e entrega",
  },
  {
    titulo: "Receba seus pedidos",
    descricao:
      "Compartilhe sua loja e acompanhe os pedidos, os dados de entrega e o contato com o cliente.",
    imagem: "/images/etapa-pedidos.png",
    alt: "Painel de pedidos com informações da compra e opções de atendimento",
  },
];

const beneficios = [
  {
    titulo: "Sua loja em um link",
    descricao:
      "Uma página própria para divulgar produtos, categorias, preços e informações.",
    icone: Store,
  },
  {
    titulo: "Pedido sem bagunça",
    descricao:
      "O cliente monta o carrinho e você recebe as informações organizadas.",
    icone: PackageCheck,
  },
  {
    titulo: "Feito para celular",
    descricao:
      "Seu cliente não precisa instalar aplicativo: basta abrir o link da loja.",
    icone: Smartphone,
  },
  {
    titulo: "Link e QR Code",
    descricao:
      "Divulgue nas redes sociais, no WhatsApp ou deixe o QR Code no balcão.",
    icone: QrCode,
  },
];

const produtosDemonstracao = [
  {
    nome: "Tênis Casual",
    preco: "R$ 129,90",
    imagem: "/images/tenis-demonstracao.png",
    alt: "Tênis casual branco com detalhes azuis",
    fundo: "bg-[#dcedfa]",
  },
  {
    nome: "Kit de Cuidados",
    preco: "R$ 49,90",
    imagem: "/images/kit-cuidados-demonstracao.png",
    alt: "Kit de cuidados pessoais com creme, sérum e sabonete",
    fundo: "bg-[#f6d0bb]",
  },
];

const perguntas = [
  {
    pergunta: "O que é o Visite Minha Loja?",
    resposta:
      "É uma plataforma para criar sua loja online, cadastrar produtos e receber pedidos dos seus clientes em um único lugar.",
  },
  {
    pergunta: "Serve para quais tipos de negócio?",
    resposta:
      "Você pode usar para lojas de roupas, calçados, cosméticos, acessórios, eletrônicos, utensílios, alimentação e outros comércios que vendem produtos.",
  },
  {
    pergunta: "Preciso saber programar?",
    resposta:
      "Não. Você configura a loja com um tutorial simples, usando campos prontos para produtos, entrega e pagamentos.",
  },
  {
    pergunta: "Meu cliente precisa baixar um aplicativo?",
    resposta:
      "Não. Ele acessa sua loja pelo navegador do celular, tablet ou computador usando o link que você divulgar.",
  },
  {
    pergunta: "Posso usar para retirada e entrega?",
    resposta:
      "Sim. Você configura as opções disponíveis para sua loja e o cliente escolhe durante o pedido.",
  },
  {
    pergunta: "Como recebo os pedidos?",
    resposta:
      "Os pedidos ficam organizados no painel da sua loja e podem ser enviados para o seu WhatsApp.",
  },
  {
    pergunta: "Quanto custa?",
    resposta:
      "O plano custa R$ 59,90 por mês. Não existe taxa de instalação nem comissão do sistema sobre as vendas.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#020b18] text-white">
      <section className="relative">
        <div className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-40 top-72 h-96 w-96 rounded-full bg-blue-600/20 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-5 sm:px-8">
          <header className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                <ShoppingBag size={21} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                  Visite Minha Loja
                </p>
                <p className="text-sm font-bold text-white">
                  Venda pela internet
                </p>
              </div>
            </Link>

            <Link
              href="/login"
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              Entrar
            </Link>
          </header>

          <div className="mx-auto grid max-w-5xl items-center gap-12 pb-8 pt-16 md:grid-cols-2 md:pt-24">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 sm:text-sm">
                <CircleCheck size={16} className="shrink-0" />
                Sem comissão sobre suas vendas
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                Pare de montar pedidos no WhatsApp.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Crie uma loja online para seus clientes escolherem produtos,
                montarem o pedido e comprarem de um jeito simples.
              </p>

              <p className="mt-4 text-sm leading-6 text-cyan-200">
                Para lojas de roupas, calçados, cosméticos, eletrônicos,
                alimentação e muito mais.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cadastro"
                  className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 text-lg font-black shadow-xl shadow-blue-500/20 transition hover:brightness-110 active:scale-[0.98]"
                >
                  Criar minha loja
                  <ArrowRight size={21} className="shrink-0" />
                </Link>

                <a
                  href="#como-funciona"
                  className="flex min-h-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] px-6 text-base font-bold transition hover:bg-white/[0.09]"
                >
                  Ver como funciona
                </a>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Cadastro simples, pagamento da assinatura e configuração guiada.
              </p>
            </div>

            <div className="relative mx-auto w-full min-w-0 max-w-md">
              <div className="absolute inset-0 rounded-[38px] bg-cyan-400/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-[#071729] p-3 shadow-2xl shadow-black/40 sm:p-4">
                <div className="rounded-[22px] border border-white/10 bg-[#f8fafc] p-3 text-slate-900 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Store size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black">Sua loja online</p>
                        <p className="text-[10px] text-slate-500">
                          Produtos e pedidos em um só lugar
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      Aberta
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-100 p-3">
                    <p className="text-xs font-bold text-slate-500">
                      O que você está procurando?
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {produtosDemonstracao.map((produto) => (
                      <div
                        key={produto.nome}
                        className="min-w-0 rounded-2xl bg-slate-100 p-2.5 sm:p-3"
                      >
                        <div
                          className={`relative aspect-square overflow-hidden rounded-xl ${produto.fundo}`}
                        >
                          <Image
                            src={produto.imagem}
                            alt={produto.alt}
                            fill
                            sizes="(max-width: 480px) 40vw, 170px"
                            className="object-contain"
                          />
                        </div>
                        <p className="mt-3 text-xs font-black leading-5 sm:text-sm">
                          {produto.nome}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {produto.preco}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-600 p-4 text-white">
                    <ShoppingBag size={20} className="shrink-0" />
                    <div>
                      <p className="text-sm font-black">Pedido organizado</p>
                      <p className="text-xs text-blue-100">
                        Pronto para você conferir
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[10px] text-slate-500">
                    Produtos e preços ilustrativos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-6 bg-white py-20 text-slate-950"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Simples de começar
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-black leading-tight tracking-tight">
            Sua loja pronta para vender em três etapas
          </h2>

          <div className="mt-12 grid items-start gap-8 md:grid-cols-3 md:gap-5">
            {etapas.map((etapa) => (
              <article
                key={etapa.titulo}
                className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-lg shadow-slate-200/40"
              >
                <div className="p-3">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-[20px] bg-[#020b18]">
                    <Image
                      src={etapa.imagem}
                      alt={etapa.alt}
                      fill
                      sizes="(max-width: 767px) 384px, 350px"
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="px-6 pb-7 pt-3">
                  <h3 className="text-xl font-black">{etapa.titulo}</h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {etapa.descricao}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#020b18] py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 sm:px-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Menos conversa repetida
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight">
              Seu cliente escolhe. Você recebe o pedido pronto.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Em vez de enviar foto, preço e disponibilidade várias vezes no
              WhatsApp, compartilhe sua loja e deixe o cliente montar o pedido
              com calma.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Produtos, fotos, preços e categorias.",
                "Carrinho para organizar o pedido.",
                "Entrega ou retirada configuradas por você.",
                "Informações do pedido reunidas no painel.",
              ].map((texto) => (
                <div key={texto} className="flex items-start gap-3">
                  <Check
                    size={20}
                    className="mt-0.5 shrink-0 text-cyan-300"
                  />
                  <p className="text-slate-200">{texto}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <MessageCircle size={21} />
              </div>
              <div>
                <p className="font-black">Pedido recebido</p>
                <p className="text-sm text-slate-400">
                  Tudo organizado para conferir
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Cliente</span>
                <span className="font-bold">Maria Silva</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Itens</span>
                <span className="font-bold">2 produtos</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Entrega</span>
                <span className="font-bold">Retirada na loja</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-slate-400">Total</span>
                <span className="text-lg font-black text-cyan-300">
                  R$ 179,80
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">
              <LayoutDashboard size={19} className="shrink-0" />
              Acompanhe tudo pelo painel da sua loja.
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              Exemplo ilustrativo de pedido.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Tudo em um só lugar
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-black leading-tight tracking-tight">
            Uma ferramenta simples para vender mais organizado
          </h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {beneficios.map(({ titulo, descricao, icone: Icone }) => (
              <article
                key={titulo}
                className="flex gap-4 rounded-[26px] border border-slate-200 p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-blue-700">
                  <Icone size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black">{titulo}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{descricao}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#020b18] py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-xl rounded-[32px] border border-cyan-300/20 bg-gradient-to-b from-cyan-400/15 to-blue-600/10 p-6 text-center shadow-2xl shadow-cyan-950/30 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Plano mensal
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Sua loja online pronta para vender
            </h2>

            <div className="mt-6 flex flex-wrap items-end justify-center gap-2">
              <strong className="text-5xl font-black tracking-tight sm:text-6xl">
                R$ 59,90
              </strong>
              <span className="mb-2 text-slate-300">por mês</span>
            </div>

            <p className="mx-auto mt-5 max-w-md leading-7 text-slate-300">
              Sem taxa de instalação e sem comissão do sistema sobre suas
              vendas.
            </p>

            <div className="mx-auto mt-7 max-w-sm space-y-3 text-left">
              {[
                "Loja online com seu próprio link",
                "Painel para produtos e pedidos",
                "Configuração de entrega e retirada",
                "Divulgação por link e QR Code",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={18} className="shrink-0 text-cyan-300" />
                  <span className="text-sm text-slate-100">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/cadastro"
              className="mt-9 flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-white px-5 text-base font-black text-slate-950 transition hover:bg-cyan-100 active:scale-[0.98] sm:text-lg"
            >
              Criar minha loja agora
              <ArrowRight size={21} className="shrink-0" />
            </Link>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Faça seu cadastro, confirme seu e-mail e ative a assinatura
              para configurar sua loja.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Tire suas dúvidas
          </p>

          <h2 className="mt-3 text-center text-4xl font-black tracking-tight">
            Perguntas frequentes
          </h2>

          <div className="mt-10">
            {perguntas.map(({ pergunta, resposta }) => (
              <details
                key={pergunta}
                className="group border-b border-slate-200 py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black [&::-webkit-details-marker]:hidden">
                  {pergunta}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-2xl font-normal text-blue-600 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pt-4 leading-7 text-slate-600">
                  {resposta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#020b18]">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center sm:px-8">
          <div className="flex items-center justify-center gap-2">
            <ShoppingBag size={17} className="text-cyan-300" />
            <p className="font-black">Visite Minha Loja</p>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Sua loja online, simples e acessível.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            <Link href="/termos" className="hover:text-white">
              Termos de Uso
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/privacidade" className="hover:text-white">
              Política de Privacidade
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} Visite Minha Loja. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}