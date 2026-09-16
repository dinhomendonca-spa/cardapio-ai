# Atualização: feedback da testadora e temas

## Ordem obrigatória

1. Abra o SQL Editor do Supabase.
2. Execute todo o arquivo `supabase/ajustes_feedback_temas.sql`.
3. Substitua os arquivos do projeto pelos arquivos deste pacote.
4. Execute `npm run build`.
5. Faça o commit e o push.

## O que foi corrigido

- Salvar configurações não recarrega mais toda a página nem volta ao topo.
- A etapa de entrega segue automaticamente para o cadastro do produto.
- O endereço fica salvo como rascunho ao abrir o Google Maps.
- O cadastro do produto informa exatamente quais campos ainda faltam.
- Preço e estoque agora deixam claro que o conteúdo vazio é apenas um exemplo.
- A imagem do produto pode ser reposicionada nos eixos horizontal e vertical.
- O posicionamento escolhido também aparece na loja pública.
- O pedido Pix é registrado antes de o cliente sair para pagar.
- O cliente vê que o Pix aguarda conferência da loja.
- O botão final passou a dizer `Já paguei — enviar pedido`.
- O lojista pode escolher separadamente o tema do painel e o tema da loja.

## Temas disponíveis

- Azul-escuro
- Nude
- Rosa-claro
- Branco
- Verde
- Vermelho
- Preto

## Validação realizada

- `npx tsc --noEmit`: aprovado.
- `npm run build`: aprovado no Next.js 16.3.4.
