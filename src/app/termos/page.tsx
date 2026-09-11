import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso | Visite Minha Loja",
  description:
    "Termos de Uso da plataforma Visite Minha Loja para criação e gestão de lojas online.",
};

const contato = "dinho_mendonca@icloud.com";

export default function TermosDeUsoPage() {
  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-6 text-slate-100 sm:px-6 sm:py-10">
      <article className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.09]"
        >
          <ArrowLeft size={17} />
          Voltar ao início
        </Link>

        <header className="mt-8 rounded-[28px] border border-sky-300/15 bg-gradient-to-br from-sky-500/20 to-blue-950/35 p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400 text-slate-950">
            <FileText size={24} />
          </div>

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-sky-300">
            Visite Minha Loja
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Termos de Uso
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Última atualização: 11 de setembro de 2026.
          </p>
        </header>

        <div className="mt-5 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-[15px] leading-7 text-slate-300 shadow-xl shadow-black/10 sm:p-8">
          <Section title="1. Aceitação destes Termos">
            Ao criar uma conta, contratar uma assinatura ou utilizar a plataforma
            Visite Minha Loja, você declara que leu e concorda com estes Termos de
            Uso e com a nossa{" "}
            <InlineLink href="/privacidade">
              Política de Privacidade
            </InlineLink>
            . Caso não concorde, não utilize a plataforma.
          </Section>

          <Section title="2. O que é a Visite Minha Loja">
            A Visite Minha Loja é uma plataforma para criação e gestão de lojas
            online. Ela permite que lojistas publiquem catálogo, recebam pedidos,
            configurem entrega, informem sua chave Pix e encaminhem pedidos ao
            WhatsApp da própria loja.
          </Section>

          <Section title="3. Cadastro e segurança da conta">
            Você deve fornecer informações verdadeiras, manter seu acesso protegido
            e comunicar qualquer uso não autorizado. A conta é individual e o
            titular responde pelas ações realizadas com suas credenciais.
          </Section>

          <Section title="4. Assinatura, cobrança e acesso">
            O acesso administrativo à plataforma depende de assinatura ativa. O
            valor, a periodicidade e as condições apresentados no momento da
            contratação integram a sua assinatura. A cobrança é gerada via Pix pelo
            Asaas. Após a confirmação do pagamento, o acesso e a publicação da loja
            são liberados conforme o plano contratado.
            <br />
            Em caso de vencimento não pago, cancelamento, estorno ou contestação de
            pagamento, a loja poderá ser bloqueada até a regularização. O bloqueio
            não transfere a titularidade dos dados ou produtos do lojista.
          </Section>

          <Section title="5. Pedidos e pagamentos dos clientes da loja">
            A Visite Minha Loja fornece a infraestrutura tecnológica. Cada lojista
            é responsável por seus produtos, preços, estoque, horários, entrega,
            atendimento, emissão de documentos fiscais, cumprimento de ofertas e
            relação comercial com seus próprios clientes.
            <br />
            Os pagamentos de pedidos feitos na loja são direcionados à chave Pix
            configurada pelo respectivo lojista. A plataforma não é vendedora dos
            produtos do catálogo, não recebe comissão sobre as vendas e não se
            responsabiliza pela entrega, qualidade ou disponibilidade dos itens
            oferecidos por cada estabelecimento.
          </Section>

          <Section title="6. Uso permitido e condutas proibidas">
            Você se compromete a utilizar a plataforma de forma lícita e a não
            publicar conteúdo ilegal, enganoso, ofensivo ou que viole direitos de
            terceiros. Também é proibido tentar acessar contas ou dados de outras
            pessoas, interferir na segurança do serviço ou usar a plataforma para
            fraude.
          </Section>

          <Section title="7. Disponibilidade e atualizações">
            Buscamos manter a plataforma disponível e segura, mas podem ocorrer
            manutenções, atualizações, falhas de conexão ou indisponibilidades de
            serviços de terceiros. Recursos podem ser aprimorados, alterados ou
            descontinuados quando necessário, respeitando contratos e direitos
            aplicáveis.
          </Section>

          <Section title="8. Proteção de dados">
            O tratamento de dados pessoais segue a LGPD e está descrito na nossa{" "}
            <InlineLink href="/privacidade">
              Política de Privacidade
            </InlineLink>
            . Em relação aos dados de clientes que compram em uma loja, o respectivo
            lojista é responsável pelas decisões comerciais e pelo atendimento ao
            cliente final; a Visite Minha Loja atua na infraestrutura necessária para
            viabilizar o serviço.
          </Section>

          <Section title="9. Direitos do consumidor">
            Estes Termos não afastam os direitos garantidos pela legislação
            aplicável, incluindo o Código de Defesa do Consumidor quando houver
            relação de consumo.
          </Section>

          <Section title="10. Alterações e contato">
            Estes Termos podem ser atualizados para refletir mudanças legais,
            técnicas ou comerciais. A versão vigente ficará disponível nesta página.
            Para dúvidas sobre a plataforma ou estes Termos, entre em contato pelo
            e-mail{" "}
            <a
              className="font-bold text-sky-300 underline underline-offset-4"
              href={`mailto:${contato}`}
            >
              {contato}
            </a>
            .
          </Section>
        </div>

        <footer className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={17} className="text-sky-300" />
            Consulte também nossa Política de Privacidade.
          </span>

          <Link
            className="font-bold text-sky-300 underline underline-offset-4"
            href="/privacidade"
          >
            Política de Privacidade
          </Link>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-extrabold text-white">
        {title}
      </h2>

      <p className="mt-2">
        {children}
      </p>
    </section>
  );
}

function InlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className="font-bold text-sky-300 underline underline-offset-4"
      href={href}
    >
      {children}
    </Link>
  );
}