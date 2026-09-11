import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade | Visite Minha Loja",
  description:
    "Política de Privacidade da plataforma Visite Minha Loja, em conformidade com a LGPD.",
};

const contato = "dinho_mendonca@icloud.com";

export default function PoliticaDePrivacidadePage() {
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

        <header className="mt-8 rounded-[28px] border border-emerald-300/15 bg-gradient-to-br from-emerald-500/20 to-sky-950/35 p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
            <LockKeyhole size={24} />
          </div>

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-200">
            Visite Minha Loja
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Política de Privacidade
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Última atualização: 11 de setembro de 2026.
          </p>
        </header>

        <div className="mt-5 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-[15px] leading-7 text-slate-300 shadow-xl shadow-black/10 sm:p-8">
          <Section title="1. Compromisso com sua privacidade">
            Esta Política explica como a Visite Minha Loja trata dados pessoais ao
            disponibilizar a plataforma de criação e gestão de lojas online. O
            tratamento observa a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei
            nº 13.709/2018), os princípios de finalidade, necessidade, transparência
            e segurança.
          </Section>

          <Section title="2. Dados que podemos tratar">
            Para disponibilizar a conta do lojista, podemos tratar nome, e-mail,
            telefone, dados de autenticação e informações da loja, como nome,
            descrição, cidade, estado, WhatsApp, imagens e chave Pix informada pelo
            próprio lojista.
            <br />
            Nos pedidos feitos em lojas hospedadas na plataforma, podem ser tratados
            nome, telefone, itens escolhidos, valores, modalidade de entrega ou
            retirada, endereço, complemento e informações de localização necessárias
            para o pedido.
          </Section>

          <Section title="3. Finalidades do tratamento">
            Utilizamos os dados para criar e proteger contas, publicar lojas,
            processar pedidos, exibir o catálogo, encaminhar o pedido ao WhatsApp do
            lojista, administrar a assinatura da plataforma, prevenir fraudes,
            prestar suporte e cumprir obrigações legais.
          </Section>

          <Section title="4. Responsabilidades sobre dados de clientes das lojas">
            Cada lojista decide quais produtos oferece, como atende seus clientes e
            como utiliza os dados recebidos em seus pedidos. Por isso, o lojista é o
            principal responsável pelas decisões relativas aos dados de seus próprios
            clientes. A Visite Minha Loja fornece a infraestrutura tecnológica e
            trata esses dados na medida necessária para executar o serviço.
          </Section>

          <Section title="5. Compartilhamento de dados">
            Compartilhamos dados apenas quando necessário para o funcionamento da
            plataforma, por exemplo com provedores de autenticação, banco de dados,
            armazenamento, hospedagem e serviços de cobrança da assinatura. O pedido
            é encaminhado ao WhatsApp da loja escolhida pelo cliente. Os pagamentos
            de pedidos são direcionados à chave Pix do próprio lojista; a Visite
            Minha Loja não recebe nem armazena dados bancários do pagamento do pedido.
          </Section>

          <Section title="6. Base legal e conservação">
            O tratamento pode ocorrer para execução de contrato e procedimentos
            relacionados, cumprimento de obrigações legais, exercício regular de
            direitos, prevenção a fraudes e, quando aplicável, consentimento. Os
            dados são mantidos pelo tempo necessário para as finalidades descritas,
            para o atendimento de obrigações legais ou para defesa de direitos.
          </Section>

          <Section title="7. Segurança">
            Adotamos medidas técnicas e organizacionais razoáveis para reduzir riscos
            de acesso não autorizado, perda, alteração ou divulgação indevida. Ainda
            assim, nenhuma transmissão ou armazenamento digital é totalmente livre de
            riscos; por isso, o usuário também deve proteger sua senha e seus acessos.
          </Section>

          <Section title="8. Seus direitos">
            Nos termos da LGPD, o titular pode solicitar confirmação de tratamento,
            acesso, correção, anonimização, bloqueio, eliminação quando aplicável,
            informação sobre compartilhamento e revisão das informações fornecidas.
            Pedidos relacionados aos dados de uma compra devem ser direcionados,
            preferencialmente, à loja onde o pedido foi feito. Caso necessário, a
            Visite Minha Loja auxiliará dentro de suas responsabilidades legais.
          </Section>

          <Section title="9. Cookies e serviços de terceiros">
            A plataforma pode utilizar recursos técnicos essenciais para manter a
            sessão, a segurança e o funcionamento do site. Serviços de terceiros
            utilizados para autenticação, hospedagem e cobrança podem aplicar seus
            próprios mecanismos técnicos e políticas de privacidade.
          </Section>

          <Section title="10. Alterações nesta Política">
            Esta Política poderá ser atualizada para refletir mudanças legais,
            operacionais ou de segurança. A data de atualização será ajustada nesta
            página sempre que houver uma nova versão.
          </Section>

          <Section title="11. Contato para privacidade">
            Para dúvidas, solicitações relacionadas a dados pessoais ou exercício de
            direitos, escreva para{" "}
            <a
              className="font-bold text-emerald-200 underline underline-offset-4"
              href={`mailto:${contato}`}
            >
              {contato}
            </a>
            .
          </Section>
        </div>

        <footer className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-200" />
            Consulte também os Termos de Uso.
          </span>

          <Link
            className="font-bold text-emerald-200 underline underline-offset-4"
            href="/termos"
          >
            Termos de Uso
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