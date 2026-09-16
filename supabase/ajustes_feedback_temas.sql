-- Execute uma vez no SQL Editor do Supabase antes de publicar esta versão.

alter table public.lojas
  add column if not exists tema_admin text not null default 'azul-escuro',
  add column if not exists tema_loja text not null default 'azul-escuro';

alter table public.produtos
  add column if not exists imagem_posicao_x smallint not null default 50,
  add column if not exists imagem_posicao_y smallint not null default 50;

alter table public.lojas
  drop constraint if exists lojas_tema_admin_check,
  add constraint lojas_tema_admin_check
    check (
      tema_admin in (
        'azul-escuro',
        'nude',
        'rosa-claro',
        'branco',
        'verde',
        'vermelho',
        'preto'
      )
    );

alter table public.lojas
  drop constraint if exists lojas_tema_loja_check,
  add constraint lojas_tema_loja_check
    check (
      tema_loja in (
        'azul-escuro',
        'nude',
        'rosa-claro',
        'branco',
        'verde',
        'vermelho',
        'preto'
      )
    );

alter table public.produtos
  drop constraint if exists produtos_imagem_posicao_x_check,
  add constraint produtos_imagem_posicao_x_check
    check (imagem_posicao_x between 0 and 100);

alter table public.produtos
  drop constraint if exists produtos_imagem_posicao_y_check,
  add constraint produtos_imagem_posicao_y_check
    check (imagem_posicao_y between 0 and 100);
