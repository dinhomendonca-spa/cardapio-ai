# Loja AI

Plataforma de loja online e cardápio digital para pequenos negócios, com painel de gestão, catálogo público, carrinho e checkout.

O projeto reúne interfaces em React, rotas de API do Next.js e integração com o Supabase para autenticação, dados e armazenamento de imagens.

## Conheça o projeto

- [Abrir loja de demonstração](https://visiteminhaloja.online/loja/loja-ai-demonstracao)
- [Conhecer a página comercial](https://visiteminhaloja.online/)
- [Acessar o login do painel](https://visiteminhaloja.online/login)
- Loguin : teste@teste.com
- Senha: teste@teste

A loja de demonstração utiliza produtos e valores fictícios. Nenhuma compra real deve ser realizada.

Existe uma conta de avaliação com loja própria e acesso vitalício. As credenciais são compartilhadas diretamente durante o processo seletivo.

## Problema que o projeto busca resolver

Pequenos comerciantes frequentemente apresentam produtos, repetem preços e organizam pedidos manualmente pelo WhatsApp.

O Loja AI permite reunir essas informações em uma vitrine digital, na qual o cliente pode consultar produtos, montar o carrinho e preencher os dados do pedido.

## Funcionalidades implementadas

### Painel do lojista

- Cadastro, login e fluxo de recuperação de senha.
- Configuração de nome, descrição, logo e banner da loja.
- Personalização de temas.
- Cadastro, edição e exclusão de produtos.
- Categorias, preços e controle de estoque.
- Configuração de horários e entrega.
- Páginas para acompanhamento de pedidos.
- Publicação da loja e geração de QR Code.
- Controle de acesso por assinatura, teste gratuito ou acesso vitalício.

### Vitrine do cliente

- Endereço individual para cada loja.
- Catálogo com imagens, preços e descrições.
- Busca e filtros por categoria.
- Carrinho com alteração de quantidades.
- Checkout com identificação do cliente.
- Opções de entrega e retirada.
- Resumo de produtos, taxa de entrega e total.

### Integrações presentes no código

- Supabase: autenticação, banco de dados e armazenamento.
- Asaas: cobranças e tratamento de notificações.
- Mercado Pago: conexão de conta e fluxos de pagamento.

A disponibilidade das integrações depende da configuração do ambiente e da loja. A validação completa de pagamentos permanece pendente nesta revisão.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Interface | React, TypeScript e Tailwind CSS |
| Aplicação e APIs | Next.js com App Router |
| Autenticação e dados | Supabase |
| Pagamentos | Asaas e Mercado Pago |
| Ícones e QR Code | Lucide React e qrcode.react |
| Publicação | Vercel |
| Versionamento | Git e GitHub |

## Organização do código

```text
src/
├── app/
│   ├── admin/              Painel do lojista
│   ├── api/                Rotas de integração e assinatura
│   ├── cadastro/           Criação de conta
│   ├── login/              Acesso ao sistema
│   ├── recuperar-senha/    Solicitação de recuperação
│   └── loja/[slug]/        Vitrine e fluxo de compra
├── components/             Componentes compartilhados
├── context/                Estado de autenticação, loja e produtos
└── lib/                    Clientes e funções de integração

supabase/                   Ajustes SQL disponíveis
public/                     Arquivos estáticos
```

## Executar localmente

### Requisitos

- Node.js e npm compatíveis com a versão do Next.js utilizada.
- Projeto Supabase configurado com as tabelas, políticas e armazenamento necessários.

A configuração completa do banco ainda precisa ser documentada; instalar as dependências não provisiona o Supabase automaticamente.

### 1. Clonar e instalar

```bash
git clone https://github.com/dinhomendonca-spa/cardapio-ai.git
cd cardapio-ai
npm ci
```

### 2. Configurar o ambiente

Crie um arquivo `.env.local` na raiz do projeto e configure:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Preencha os valores correspondentes ao seu projeto Supabase.

A chave `SUPABASE_SERVICE_ROLE_KEY` é utilizada exclusivamente no servidor. Não publique o arquivo `.env.local` nem exponha essa chave no código do navegador.

Os fluxos de cobrança exigem configurações adicionais dos respectivos provedores, incluindo `ASAAS_API_URL` e `ASAAS_API_KEY` para o Asaas.

### 3. Iniciar

```bash
npm run dev
```

Abra o endereço indicado no terminal. No PowerShell, caso a execução de `npm.ps1` esteja bloqueada, utilize `npm.cmd run dev`.

### Outros comandos disponíveis

```bash
npm run lint
npm run build
npm run start
```

O comando `start` utiliza o build gerado anteriormente.

## Validação atual

Foram conferidos manualmente:

- Login da conta de demonstração.
- Carregamento da vitrine, das imagens e do produto de exemplo.
- Inclusão de produto no carrinho.
- Abertura do checkout.
- Cálculo do total com taxa de entrega.
- Mensagens do cadastro conforme o plano selecionado.
- Contraste dos botões de categoria e da barra do carrinho.

A finalização de pedidos e o ciclo completo de pagamento ainda precisam de validação.

## Próximas melhorias

- Ampliar o catálogo de demonstração.
- Adicionar capturas da vitrine, do painel e do checkout.
- Documentar o provisionamento do banco de dados.
- Ampliar os testes dos fluxos principais.
- Concluir a validação das integrações de pagamento.

## Autor

**Jadson Freire de Mendonça**

Bacharel em Sistemas de Informação.

(https://github.com/dinhomendonca-spa)
