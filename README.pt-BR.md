# Mini-CRM

[![CI](https://github.com/vidalicaro-byte/mini-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/vidalicaro-byte/mini-crm/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

[🇺🇸 English](README.md) · 🇧🇷 Português

Front end de um CRM de vendas: painel com indicadores e gráficos, listas de contatos e de empresas com busca, e um funil kanban onde se arrastam negócios entre etapas — com perfis de acesso, temas claro e escuro e layout para celular. Ele roda contra uma **API simulada dentro do navegador**, então a demonstração não precisa de servidor.

**[▶ Demonstração online](https://mini-crm-ten-coral.vercel.app/)** — na tela de login, clique em "Entrar como administradora" ou "Entrar como vendedor".

|                                                    |                                                   |
| -------------------------------------------------- | ------------------------------------------------- |
| ![Visão geral](docs/screenshots/overview-dark.png) | ![Funil](docs/screenshots/pipeline-dark.png)      |
| ![Contatos](docs/screenshots/contacts-light.png)   | ![Empresas](docs/screenshots/companies-light.png) |

<p>
  <img src="docs/screenshots/mobile-overview-dark.png" alt="Visão geral no celular" width="260">
  <img src="docs/screenshots/mobile-pipeline-dark.png" alt="Funil no celular" width="260">
  <img src="docs/screenshots/company-light.png" alt="Página de uma empresa" width="420">
</p>

## O que ele faz

- **Login com perfis.** A _administradora_ vê tudo; o _vendedor_ vê só os próprios contatos e negócios (quem garante isso é a API, não só as telas). Só a administradora acessa a página da equipe.
- **Visão geral.** Cinco indicadores (contatos, novos contatos, negócios em aberto, receita ganha e taxa de conversão) comparados com o período anterior, um gráfico de negócios por etapa e outro de receita ao longo do tempo. O filtro de período (7 dias, 30 dias, 90 dias, 12 meses) fica na URL. Cada gráfico tem um resumo em texto e seus dados em tabela.
- **Contatos.** Busca, filtro por empresa, ordenação e paginação feitas no servidor, tudo guardado na URL (links compartilháveis e botão Voltar que funciona). Página de detalhe com negócios e histórico de atividades; criação e edição com validação em português.
- **Empresas.** As mesmas ferramentas de lista, mais um filtro de porte; o detalhe mostra contatos, negócios em aberto e um resumo. Os números contam só o que o usuário logado pode ver.
- **Funil.** Um quadro kanban: arraste um negócio entre as etapas com o mouse, com toque ou com o teclado, ou use o menu "Mover" de cada cartão. O cartão muda de coluna na hora e volta, com uma explicação, se o servidor recusar.
- **Em todo o app:** temas claro e escuro, layout responsivo, esqueletos de carregamento e estados de erro e de lista vazia, com nova tentativa.

## Notas de engenharia

- **API simulada com contrato de verdade.** O [MSW](https://mswjs.io/) intercepta as requisições com latência realista, validação (`422`), conflitos (`409`), `401` e `403`. Toda resposta é validada por schemas [Zod](https://zod.dev/) compartilhados entre o cliente e a simulação; trocar por um backend real significa mudar o endereço da API, não as telas.
- **Estado do servidor com TanStack Query**: chaves de consulta por lista, `keepPreviousData` ao paginar, invalidação depois das escritas (um novo contato atualiza a visão geral e os números das empresas) e atualização otimista com desfazer por cartão no funil.
- **A URL é o estado da lista.** Funções puras leem e escrevem os filtros (com testes, inclusive para URLs inválidas ou editadas à mão); um mesmo hook atende as listas de contatos e de empresas.
- **Acessibilidade é testada, não suposta.** O [axe](https://github.com/dequelabs/axe-core) roda em todas as páginas, nos temas claro e escuro, no desktop e no celular, no CI. Ele achou problemas reais pelo caminho (marcação de lista, um controle cujo nome diferia do texto visível, rótulos de baixo contraste), já corrigidos. O funil funciona pelo teclado, com anúncios em português, e o app tem link "pular para o conteúdo" e move o foco ao navegar.
- **Desempenho.** As rotas carregam sob demanda, os gráficos carregam depois dos números, e o pacote da camada simulada caiu de 521 kB para 251 kB ao trocar, nas builds de produção, uma dependência que não é usada.

### Qualidade

| O quê                                       | Como                                                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 245 testes unitários e de integração        | [Vitest](https://vitest.dev/) + Testing Library, com a API simulada rodando por baixo                                                                          |
| 75 testes ponta a ponta e de acessibilidade | [Playwright](https://playwright.dev/) + axe contra a build de produção, perfis desktop e celular                                                               |
| Verificações estáticas                      | TypeScript (strict, `noUncheckedIndexedAccess`), [oxlint](https://oxc.rs/docs/guide/usage/linter) (com regras jsx-a11y), Prettier                              |
| Higiene de Git                              | Husky + lint-staged, [Conventional Commits](https://www.conventionalcommits.org/pt-br/) com commitlint, squash merge                                           |
| CI                                          | O GitHub Actions roda as verificações e os testes ponta a ponta em todo pull request, e a `main` é protegida; o Dependabot propõe atualizações de dependências |

### Lighthouse

Mediana de 3 execuções por página com `npm run lighthouse` (Chrome sem interface, build de produção; o perfil de celular usa a simulação de 4G lenta do Lighthouse e CPU 4× mais lenta).

| Perfil  | Página      | Desempenho | Acessibilidade | Boas práticas | SEO | LCP   | TBT    | CLS   |
| ------- | ----------- | ---------- | -------------- | ------------- | --- | ----- | ------ | ----- |
| celular | Login       | 92         | 100            | 100           | 100 | 0.8 s | 339 ms | 0.000 |
| celular | Visão geral | 90         | 100            | 100           | 100 | 1.8 s | 400 ms | 0.000 |
| celular | Contatos    | 86         | 100            | 100           | 100 | 1.9 s | 524 ms | 0.000 |
| celular | Funil       | 83         | 100            | 100           | 100 | 1.7 s | 675 ms | 0.000 |
| desktop | Login       | 100        | 100            | 100           | 100 | 0.3 s | 13 ms  | 0.000 |
| desktop | Visão geral | 100        | 100            | 100           | 100 | 0.6 s | 16 ms  | 0.000 |
| desktop | Contatos    | 100        | 100            | 100           | 100 | 0.6 s | 14 ms  | 0.000 |
| desktop | Funil       | 100        | 100            | 100           | 100 | 0.6 s | 72 ms  | 0.000 |

Os números variam de máquina para máquina; rode o comando para medir na sua.

## Tecnologias

React 19 · TypeScript · Vite · Material UI (com MUI X Data Grid e Charts) · React Router · TanStack Query · React Hook Form + Zod · dnd-kit · MSW · Vitest · Playwright · Publicado na Vercel.

## Rodando localmente

Requer Node.js 24 ou mais novo.

```bash
git clone https://github.com/vidalicaro-byte/mini-crm.git
cd mini-crm
npm install
npm run dev
```

Abra http://localhost:5173. Contas de demonstração (também com um clique na tela de login):

| Perfil         | E-mail                | Senha      |
| -------------- | --------------------- | ---------- |
| Administradora | `marina@minicrm.demo` | `demo1234` |
| Vendedor       | `rafael@minicrm.demo` | `demo1234` |

| Comando                                          | O que faz                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `npm run dev`                                    | Servidor de desenvolvimento                                               |
| `npm run build` / `npm run preview`              | Build de produção / servi-la localmente                                   |
| `npm test`                                       | Testes unitários e de integração                                          |
| `npx playwright install chromium`, `npm run e2e` | Baixa o navegador de teste uma vez e roda os testes ponta a ponta e o axe |
| `npm run lighthouse`                             | Faz a build, serve e mede com o Lighthouse                                |
| `npm run lint` · `typecheck` · `format:check`    | Verificações estáticas                                                    |
| `npm run seed`                                   | Gera de novo os dados fictícios (`src/mocks/seed.json`)                   |

## Estrutura

```
src/
  api/          cliente HTTP e schemas Zod (o contrato)
  app/          rotas, layout, navegação
  components/   peças compartilhadas (cabeçalho de página, busca, seções de detalhe)
  features/     uma pasta por área: auth, dashboard, contacts, companies, pipeline, deals, team
  hooks/        useUrlFilters
  mocks/        a API no navegador: handlers, dados, autorização, cálculo da visão geral
  theme/        temas claro e escuro
e2e/            testes do Playwright
```

## Limitações

- Os dados são fictícios e ficam na memória do navegador: **recarregar a página os reinicia** (você continua logado). Nada é enviado para lugar nenhum.
- A interface está só em português do Brasil; não há camada de tradução.
- Empresas e negócios são somente leitura na interface (contatos podem ser criados e editados; os negócios mudam de etapa).
- É uma vitrine de front end: ainda não há backend real. Está planejada uma versão full-stack, com este front end sobre uma API em TypeScript.

## Licença

[MIT](LICENSE)
