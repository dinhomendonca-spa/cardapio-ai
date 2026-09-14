"use client";

import {
  Suspense,
  type FormEvent,
  type InputHTMLAttributes,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MailCheck,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  type DadosCadastro,
  type PlanoCadastro,
  useAuth,
} from "@/context/AuthContext";

type CampoProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  };

const estadoInicial: DadosCadastro = {
  nome: "",
  cpf: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  email: "",
  senha: "",
};

function Campo({
  label,
  className = "",
  ...props
}: CampoProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </span>

      <input
        {...props}
        className={`
          h-12
          w-full
          rounded-2xl
          border
          border-slate-200
          bg-slate-50
          px-4
          text-sm
          text-slate-950
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-sky-400
          focus:bg-white
          focus:ring-4
          focus:ring-sky-100
          disabled:cursor-not-allowed
          disabled:opacity-60
          ${className}
        `}
      />
    </label>
  );
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCPF(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor: string) {
  const numeros =
    somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(
        /(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  return numeros
    .replace(
      /(\d{2})(\d)/,
      "($1) $2"
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
}

function formatarCEP(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 8)
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
}

function cpfValido(valor: string) {
  const cpf =
    somenteNumeros(valor);

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
    return false;
  }

  const calcularDigito = (
    quantidade: number
  ) => {
    let soma = 0;

    for (
      let indice = 0;
      indice < quantidade;
      indice += 1
    ) {
      soma +=
        Number(cpf[indice]) *
        (quantidade + 1 - indice);
    }

    const resto =
      (soma * 10) % 11;

    return resto === 10
      ? 0
      : resto;
  };

  return (
    calcularDigito(9) ===
      Number(cpf[9]) &&
    calcularDigito(10) ===
      Number(cpf[10])
  );
}

function CadastroConteudo() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const {
    cadastrar,
    reenviarConfirmacao,
  } = useAuth();

  const planoInicial: PlanoCadastro =
    searchParams.get("plano") === "anual"
      ? "anual"
      : searchParams.get("plano") === "mensal"
        ? "mensal"
        : "teste";

  const [
    plano,
    setPlano,
  ] = useState<PlanoCadastro>(
    planoInicial
  );

  const [dados, setDados] =
    useState<DadosCadastro>(
      estadoInicial
    );

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    buscandoCep,
    setBuscandoCep,
  ] = useState(false);

  const [
    aceitouTermos,
    setAceitouTermos,
  ] = useState(false);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    reenviando,
    setReenviando,
  ] = useState(false);

  const [
    mostrarAcoesConta,
    setMostrarAcoesConta,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const atualizar = (
    campo: keyof DadosCadastro,
    valor: string
  ) => {
    setDados((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    if (campo === "email") {
      setMostrarAcoesConta(false);
      setMensagem("");
    }
  };

  const buscarCep = async () => {
    const cep =
      somenteNumeros(dados.cep);

    if (cep.length !== 8) {
      return;
    }

    setBuscandoCep(true);
    setErro("");

    try {
      const resposta =
        await fetch(
          `https://viacep.com.br/ws/${cep}/json/`
        );

      const endereco =
        await resposta.json();

      if (
        !resposta.ok ||
        endereco.erro
      ) {
        throw new Error(
          "CEP não encontrado."
        );
      }

      setDados((anterior) => ({
        ...anterior,

        endereco:
          endereco.logradouro ||
          anterior.endereco,

        bairro:
          endereco.bairro ||
          anterior.bairro,

        cidade:
          endereco.localidade ||
          anterior.cidade,

        estado:
          endereco.uf ||
          anterior.estado,
      }));
    } catch {
      setErro(
        "Não conseguimos localizar o CEP. Preencha o endereço manualmente."
      );
    } finally {
      setBuscandoCep(false);
    }
  };

  const reenviarEmail =
    async () => {
      setErro("");
      setMensagem("");

      const email =
        dados.email
          .trim()
          .toLowerCase();

      if (
        !email ||
        !email.includes("@")
      ) {
        setErro(
          "Digite seu e-mail no campo acima para reenviar a confirmação."
        );

        return;
      }

      setReenviando(true);

      try {
        await reenviarConfirmacao(
          email,
          plano
        );

        setMensagem(
          "E-mail de confirmação enviado novamente. Confira sua caixa de entrada e também a pasta de spam."
        );

        setMostrarAcoesConta(true);
      } catch (error) {
        const texto =
          error instanceof Error
            ? error.message
            : "";

        setErro(
          texto ||
            "Não foi possível reenviar o e-mail de confirmação."
        );

        setMostrarAcoesConta(true);
      } finally {
        setReenviando(false);
      }
    };

  const enviarCadastro =
    async (
      evento: FormEvent<HTMLFormElement>
    ) => {
      evento.preventDefault();

      setErro("");
      setMensagem("");
      setMostrarAcoesConta(false);

      if (
        dados.nome.trim().length < 5
      ) {
        setErro(
          "Digite seu nome completo."
        );

        return;
      }

      if (!cpfValido(dados.cpf)) {
        setErro(
          "Digite um CPF válido."
        );

        return;
      }

      if (
        somenteNumeros(
          dados.telefone
        ).length < 10
      ) {
        setErro(
          "Digite um telefone válido."
        );

        return;
      }

      if (
        somenteNumeros(
          dados.cep
        ).length !== 8
      ) {
        setErro(
          "Digite um CEP válido."
        );

        return;
      }

      if (
        !dados.endereco.trim() ||
        !dados.numero.trim() ||
        !dados.bairro.trim() ||
        !dados.cidade.trim() ||
        dados.estado.trim()
          .length !== 2
      ) {
        setErro(
          "Preencha o endereço completo."
        );

        return;
      }

      if (
        !dados.email.includes("@")
      ) {
        setErro(
          "Digite um e-mail válido."
        );

        return;
      }

      if (
        dados.senha.length < 8
      ) {
        setErro(
          "A senha precisa ter pelo menos 8 caracteres."
        );

        return;
      }

      if (
        dados.senha !==
        confirmarSenha
      ) {
        setErro(
          "As senhas não são iguais."
        );

        return;
      }

      if (!aceitouTermos) {
        setErro(
          "Você precisa aceitar os Termos de Uso e a Política de Privacidade."
        );

        return;
      }

      setEnviando(true);

      try {
        const resultado =
          await cadastrar(
            dados,
            plano
          );

        if (
          resultado
            .precisaConfirmarEmail
        ) {
          router.replace(
            `/verifique-email?email=${encodeURIComponent(
              dados.email
                .trim()
                .toLowerCase()
            )}&plano=${plano}`
          );

          return;
        }

        router.replace(
          `/assinar?plano=${plano}`
        );
      } catch (error) {
        const texto =
          error instanceof Error
            ? error.message
            : "";

        const normalizada =
          texto.toLowerCase();

        const jaExiste =
          normalizada.includes(
            "already"
          ) ||
          normalizada.includes(
            "registered"
          ) ||
          normalizada.includes(
            "exists"
          ) ||
          normalizada.includes(
            "duplicate"
          );

        if (jaExiste) {
          setErro(
            "Este e-mail já possui um cadastro. Você pode entrar na sua conta ou reenviar o e-mail de confirmação."
          );

          setMostrarAcoesConta(true);
        } else {
          setErro(
            texto ||
              "Não foi possível concluir o cadastro."
          );
        }
      } finally {
        setEnviando(false);
      }
    };

  const linkLogin =
    `/login?plano=${plano}`;

  return (
    <main className="min-h-screen bg-[#020b18] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-lg">

        <header className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_16px_50px_rgba(14,165,233,0.35)]">
            <Building2
              size={30}
            />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
            Visite Minha Loja
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Teste sua loja por 30 dias
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Cadastre-se, confirme seu
            e-mail e faça o primeiro
            pagamento para liberar o
            painel.
          </p>
        </header>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            ["1", "Cadastro"],
            ["2", "Teste gratuito"],
            ["3", "Decida depois"],
          ].map(
            ([numero, texto]) => (
              <div
                key={numero}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center"
              >
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-sky-400/15 text-xs font-black text-sky-300">
                  {numero}
                </span>

                <p className="mt-2 text-[11px] font-semibold text-slate-300">
                  {texto}
                </p>
              </div>
            )
          )}
        </div>

        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-center text-xs font-black uppercase tracking-[0.16em] text-sky-300">
            Escolha como começar
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setPlano("teste")}
              className={`rounded-2xl border p-4 text-left transition ${
                plano === "teste"
                  ? "border-sky-400 bg-sky-400/15 ring-2 ring-sky-400/20"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <p className="text-sm font-black text-white">Teste grátis</p>
              <p className="mt-1 text-xs text-slate-300">30 dias sem cartão</p>
            </button>

            <button
              type="button"
              onClick={() => setPlano("mensal")}
              className={`rounded-2xl border p-4 text-left transition ${
                plano === "mensal"
                  ? "border-sky-400 bg-sky-400/15 ring-2 ring-sky-400/20"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <p className="text-sm font-black text-white">Plano mensal</p>
              <p className="mt-1 text-xs text-slate-300">R$ 59,90 por mês</p>
            </button>

            <button
              type="button"
              onClick={() => setPlano("anual")}
              className={`rounded-2xl border p-4 text-left transition ${
                plano === "anual"
                  ? "border-emerald-400 bg-emerald-400/15 ring-2 ring-emerald-400/20"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <p className="text-sm font-black text-white">Plano anual</p>
              <p className="mt-1 text-xs text-slate-300">12x de R$ 49,75</p>
            </button>
          </div>

          <div className={`mt-4 rounded-2xl border p-4 text-center ${
            plano === "anual"
              ? "border-emerald-400/20 bg-emerald-400/[0.08]"
              : "border-sky-400/20 bg-sky-400/[0.08]"
          }`}>
            <p className={`text-xs font-black uppercase tracking-[0.14em] ${
              plano === "anual" ? "text-emerald-300" : "text-sky-300"
            }`}>
              {plano === "teste"
                ? "Teste grátis selecionado"
                : plano === "mensal"
                  ? "Plano mensal selecionado"
                  : "Oferta anual selecionada"}
            </p>

            <p className="mt-2 text-lg font-black text-white">
              {plano === "teste"
                ? "30 dias grátis"
                : plano === "mensal"
                  ? "R$ 59,90 por mês"
                  : "12x de R$ 49,75"}
            </p>
          </div>
        </section>

        <form
          onSubmit={
            enviarCadastro
          }
          className="rounded-[32px] bg-white p-5 text-slate-950 shadow-2xl sm:p-7"
        >

          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <UserRound
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-black">
                  Seus dados
                </h2>

                <p className="text-xs text-slate-500">
                  Dados do responsável
                  pela conta
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <Campo
                label="Nome completo"
                name="nome"
                autoComplete="name"
                placeholder="Digite seu nome completo"
                value={dados.nome}
                onChange={(
                  evento
                ) =>
                  atualizar(
                    "nome",
                    evento.target
                      .value
                  )
                }
                disabled={
                  enviando
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  label="CPF"
                  name="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={dados.cpf}
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "cpf",
                      formatarCPF(
                        evento
                          .target
                          .value
                      )
                    )
                  }
                  disabled={
                    enviando
                  }
                />

                <Campo
                  label="Telefone/WhatsApp"
                  name="telefone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(22) 99999-9999"
                  value={
                    dados.telefone
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "telefone",
                      formatarTelefone(
                        evento
                          .target
                          .value
                      )
                    )
                  }
                  disabled={
                    enviando
                  }
                />
              </div>
            </div>
          </section>

          <div className="my-7 h-px bg-slate-100" />

          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <MapPin
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-black">
                  Endereço
                </h2>

                <p className="text-xs text-slate-500">
                  Utilizado no cadastro
                  da cobrança
                </p>
              </div>
            </div>

            <div className="grid gap-4">

              <div className="relative">
                <Campo
                  label="CEP"
                  name="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  value={dados.cep}
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "cep",
                      formatarCEP(
                        evento
                          .target
                          .value
                      )
                    )
                  }
                  onBlur={
                    buscarCep
                  }
                  disabled={
                    enviando
                  }
                />

                {buscandoCep && (
                  <LoaderCircle
                    className="absolute bottom-3 right-4 animate-spin text-sky-500"
                    size={20}
                  />
                )}
              </div>

              <Campo
                label="Endereço"
                name="endereco"
                autoComplete="street-address"
                placeholder="Rua ou avenida"
                value={
                  dados.endereco
                }
                onChange={(
                  evento
                ) =>
                  atualizar(
                    "endereco",
                    evento.target
                      .value
                  )
                }
                disabled={
                  enviando
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Campo
                  label="Número"
                  name="numero"
                  autoComplete="address-line2"
                  placeholder="123"
                  value={
                    dados.numero
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "numero",
                      evento.target
                        .value
                    )
                  }
                  disabled={
                    enviando
                  }
                />

                <Campo
                  label="Complemento"
                  name="complemento"
                  placeholder="Opcional"
                  value={
                    dados.complemento
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "complemento",
                      evento.target
                        .value
                    )
                  }
                  disabled={
                    enviando
                  }
                />
              </div>

              <Campo
                label="Bairro"
                name="bairro"
                placeholder="Seu bairro"
                value={
                  dados.bairro
                }
                onChange={(
                  evento
                ) =>
                  atualizar(
                    "bairro",
                    evento.target
                      .value
                  )
                }
                disabled={
                  enviando
                }
              />

              <div className="grid grid-cols-[1fr_88px] gap-4">
                <Campo
                  label="Cidade"
                  name="cidade"
                  autoComplete="address-level2"
                  placeholder="Sua cidade"
                  value={
                    dados.cidade
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "cidade",
                      evento.target
                        .value
                    )
                  }
                  disabled={
                    enviando
                  }
                />

                <Campo
                  label="UF"
                  name="estado"
                  autoComplete="address-level1"
                  placeholder="RJ"
                  maxLength={2}
                  value={
                    dados.estado
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "estado",
                      evento.target.value
                        .replace(
                          /[^a-zA-Z]/g,
                          ""
                        )
                        .toUpperCase()
                        .slice(
                          0,
                          2
                        )
                    )
                  }
                  disabled={
                    enviando
                  }
                />
              </div>
            </div>
          </section>

          <div className="my-7 h-px bg-slate-100" />

          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <LockKeyhole
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-black">
                  Acesso
                </h2>

                <p className="text-xs text-slate-500">
                  E-mail e senha do
                  painel
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative">
                <Campo
                  label="E-mail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={
                    dados.email
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "email",
                      evento.target
                        .value
                    )
                  }
                  disabled={
                    enviando
                  }
                  className="pl-11"
                />

                <Mail
                  size={18}
                  className="absolute bottom-[15px] left-4 text-slate-400"
                />
              </div>

              <div className="relative">
                <Campo
                  label="Senha"
                  name="senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={
                    dados.senha
                  }
                  onChange={(
                    evento
                  ) =>
                    atualizar(
                      "senha",
                      evento.target
                        .value
                    )
                  }
                  disabled={
                    enviando
                  }
                  className="pr-12"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      (
                        valor
                      ) =>
                        !valor
                    )
                  }
                  className="absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center text-slate-400"
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>

              <Campo
                label="Confirme sua senha"
                name="confirmarSenha"
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                value={
                  confirmarSenha
                }
                onChange={(
                  evento
                ) =>
                  setConfirmarSenha(
                    evento.target
                      .value
                  )
                }
                disabled={
                  enviando
                }
              />
            </div>
          </section>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={
                aceitouTermos
              }
              onChange={(
                evento
              ) =>
                setAceitouTermos(
                  evento.target
                    .checked
                )
              }
              className="mt-1 h-4 w-4 accent-sky-500"
              disabled={
                enviando
              }
            />

            <span className="text-xs leading-5 text-slate-600">
              Li e aceito os{" "}
              <Link
                href="/termos"
                className="font-bold text-sky-600 underline"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                className="font-bold text-sky-600 underline"
              >
                Política de Privacidade
              </Link>
              . Nas contratações online,
              o cancelamento pode ser
              solicitado em até 7 dias,
              conforme a legislação
              aplicável.
            </span>
          </label>

          {erro && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
              <div className="flex items-start gap-2">
                <MailCheck
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {mensagem}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              enviando ||
              reenviando
            }
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? (
              <>
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />

                Criando sua conta...
              </>
            ) : (
              <>
                Continuar

                <ArrowRight
                  size={19}
                />
              </>
            )}
          </button>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-center text-sm font-black text-slate-800">
              Já começou seu cadastro antes?
            </p>

            <p className="mt-1 text-center text-xs leading-5 text-slate-500">
              Entre na sua conta ou
              peça um novo e-mail de
              confirmação.
            </p>

            <div className="mt-4 grid gap-3">
              <Link
                href={linkLogin}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 transition hover:border-sky-300 hover:text-sky-600"
              >
                <UserRound
                  size={17}
                />

                Já tenho conta
              </Link>

              <button
                type="button"
                onClick={
                  reenviarEmail
                }
                disabled={
                  enviando ||
                  reenviando
                }
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 text-sm font-black text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reenviando ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />

                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={17}
                    />

                    Reenviar confirmação
                  </>
                )}
              </button>
            </div>
          </div>

          {mostrarAcoesConta && (
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Se você já confirmou seu
              e-mail anteriormente,
              escolha{" "}
              <strong>
                Já tenho conta
              </strong>
              .
            </p>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck
              size={16}
              className="text-emerald-500"
            />

            Seus dados são protegidos
          </div>
        </form>

        <div className="mt-5 rounded-3xl border border-sky-300/15 bg-white/[0.05] p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <div>
              <p className="text-sm font-bold">
                {plano === "teste"
                  ? "Teste grátis — 30 dias sem cartão"
                  : plano === "anual"
                    ? "Plano anual — 12x de R$ 49,75"
                    : "Plano mensal — R$ 59,90"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Nenhuma cobrança será
                realizada antes da
                confirmação do seu
                e-mail e da sua
                autorização.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já possui uma conta?{" "}
          <Link
            href={linkLogin}
            className="font-bold text-sky-300"
          >
            Entrar
          </Link>
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Sparkles
            size={14}
          />

          Visite Minha Loja
        </div>
      </div>
    </main>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020b18] text-white">
          <div className="text-center">
            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-sky-400"
            />

            <p className="mt-3 text-sm text-slate-400">
              Carregando cadastro...
            </p>
          </div>
        </main>
      }
    >
      <CadastroConteudo />
    </Suspense>
  );
}

