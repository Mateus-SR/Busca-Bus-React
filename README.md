# Busca Bus
## [FatecDSM-2025/2]
### Monitoramento de ônibus em tempo real para o transporte urbano de São Paulo

Originalmente projetado para uso interno na Fatec Zona Leste, o projeto cresceu e agora atende qualquer instituição do município de São Paulo, em toda localidade onde os ônibus da SPTrans atuam. O sistema consulta a API [Olho Vivo](https://www.sptrans.com.br/desenvolvedores/api-do-olho-vivo-guia-de-referencia) da SPTrans e mostra, em uma "exibição" (um painel pensado para ficar aberto numa tela), os ônibus que estão chegando a uma ou mais paradas, com o status de cada um (Normal, Atrasado ou Adiantado).

Este repositório é a **versão refeita em React/Next.js** do projeto original ([Sistema-Monitoramento-Linhas-Onibus](https://github.com/Mateus-SR/Sistema-Monitoramento-Linhas-Onibus), feito com Jekyll, JavaScript puro e Supabase). A atualização das exibições agora é feita por **WebSocket (Socket.IO)**, não mais por consultas repetidas do navegador.

## Sumário
- [Instruções de uso](#instruções-de-uso)
- [Como o projeto funciona](#como-o-projeto-funciona)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Instruções de instalação (localmente)](#instruções-de-instalação-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Painel "Detalhes técnicos" e simulação de falhas](#painel-detalhes-técnicos-e-simulação-de-falhas)
- [Hospedagem](#hospedagem)
- [Como modificar](#como-modificar)
- [Referência da API](#referência-da-api)
- [Estado atual e limitações conhecidas](#estado-atual-e-limitações-conhecidas)
- [Comandos](#comandos)

---

## Instruções de uso
1. Acesse o site hospedado _(ou rode localmente, veja [instalação](#instruções-de-instalação-localmente))_.
2. Caso possua o código de 6 caracteres de uma exibição, insira-o no campo da tela inicial e clique em **Acessar**.
   - Caso não o possua, crie uma nova exibição ou fale com o responsável por gerenciar as exibições na sua instituição.
   - Para criar uma exibição, é necessário ter o(s) código(s) da(s) parada(s). Verifique presencialmente no ponto desejado se [o informativo do ponto](https://www.sptrans.com.br/media/3714/comunicacao2019.jpg) está presente.
     - O código da parada pode ser localizado no canto superior esquerdo do informativo.
   - Se mesmo assim não for possível ter acesso ao código de parada, entre em contato com a SPTrans solicitando-o.
   - Observação: apesar do [tutorial do Olho Vivo](https://olhovivo.sptrans.com.br/files/TutorialNovoOlhoVivo.pdf) indicar ser possível encontrar o código pelo site, essa funcionalidade não está mais disponível. Para obter o código online:
     1. Acesse `https://www.sptrans.com.br/itinerarios/linha/?numero=<letreiro>`, substituindo `<letreiro>` pelo letreiro completo de algum ônibus que passa pelo ponto _(ex.: 273D-10)_.
     2. No mapa, localize manualmente o ponto desejado e clique sobre ele _(os pontos aparecem como círculos azuis)_.
     3. Clique em "Ver no Olho Vivo".
     4. Copie o código numérico presente na URL após `Parada&PID=`.
3. Na exibição, atalhos úteis:
   - **Abrir Mapa**: mostra a localização dos ônibus.
   - **Ctrl + Shift + D**: abre/fecha o painel "Detalhes técnicos" (diagnóstico).
   - Controles de zoom da exibição e menu de **Acessibilidade** (tamanho do texto e esquema de cores). Leitores de tela também são avisados quando um ônibus novo aparece no radar.

## Como o projeto funciona

```text
 Navegador (apps/web)                Servidor (apps/server)                 SPTrans
┌──────────────────────┐  WebSocket ┌──────────────────────────┐   HTTPS   ┌────────────┐
│ Next.js + React 19   │◄──────────►│ Express + Socket.IO      │──────────►│ Olho Vivo  │
│ Exibição, mapa, etc. │  (REST só  │  - poller (1 consulta por│  (token   │ API v2.1   │
└──────────────────────┘  fallback) │    parada, compartilhada)│  no       └────────────┘
                                    │  - salas por exibição    │  servidor)
                                    │  - MongoDB (opcional)    │
                                    └──────────────────────────┘
```

- O **token da SPTrans fica só no servidor**. Ele é enviado apenas ao login da SPTrans e nunca é devolvido pela API REST ou pelo Socket.IO.
- O servidor mantém **uma consulta por parada**, não importa quantos navegadores estejam assistindo. Os resultados são distribuídos por **salas** (uma por exibição), a cada 5 s por padrão.
- Quando as paradas de uma exibição respondem quase juntas, o servidor agrupa tudo em **um único snapshot por cliente** (janela de 500 ms, ver `COALESCING_MS`).
- Se o WebSocket cair, o navegador reconecta sozinho e, enquanto isso, usa a rota REST `/v1/exibicoes/:codigo/radar` como contingência (a cada 10 s, respondida do cache do servidor).
- Se a SPTrans falhar, o servidor repete a consulta com recuo exponencial (até 60 s) e informa o erro no snapshot.
- Cada ônibus recebe um **status** comparando a previsão atual com a primeira previsão vista para ele (a "promessa"): diferença ≥ `tempoAtraso` min → **Atrasado**; ≤ −`tempoAdiantado` min → **Adiantado**; senão **Normal**.

## Estrutura do repositório

Monorepo com [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) (`apps/*` e `packages/*`).

```text
.
├── apps/
│   ├── web/              # Site (Next.js 16, App Router, React 19, Tailwind CSS v4, Leaflet)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (site)/   # Páginas públicas: início, exibição, mapa, configuração, favoritos, sobre...
│   │       │   └── (auth)/   # login, cadastro, reset-senha (sem o cabeçalho do site)
│   │       ├── components/   # Por domínio: layout, ui, home, exibicao, configuracao, listas, mapa, auth
│   │       ├── contexts/     # Auth (mock), acessibilidade, loading, cabeçalho
│   │       ├── hooks/        # useExibicao, useRadarOnibus (conexão Socket.IO + fallback REST)
│   │       ├── lib/fixtures/ # Dados fictícios temporários (exibições, instituições, usuário, mapa)
│   │       └── store/        # Favoritos (Zustand)
│   ├── server/           # API REST + Socket.IO (Node.js, Express 5, MongoDB)
│   │   └── src/
│   │       ├── index.js      # Ponto de entrada
│   │       ├── config.js     # Leitura e validação das variáveis de ambiente
│   │       ├── db.js         # Conexão e índices do MongoDB
│   │       ├── http/         # app.js + routes/ (health, auth, exibicoes, me)
│   │       ├── realtime/     # socket.js (salas, snapshots) e poller.js (consulta à SPTrans)
│   │       ├── sptrans/      # cliente.js (login/cookie/renovação), normalizar.js, simulador.js
│   │       └── repos/        # Acesso ao banco (exibições, usuários)
│   └── mobile/           # React Native (em preparação, ainda não executável)
├── packages/
│   └── core/             # Código compartilhado e sem dependência de plataforma:
│                         # eventos do socket, cálculo de status, tempo, DTOs, validações, cliente da API, stores
├── render.yaml           # Blueprint de hospedagem no Render (site estático + servidor)
├── CLAUDE.md / AGENTS.md # Convenções do projeto para agentes de IA
└── package.json          # Scripts do monorepo
```

Regra de organização: código de navegador/Next.js fica em `apps/web`, código React Native em `apps/mobile` e lógica sem plataforma em `packages/core`.

## Instruções de instalação (localmente)

### Requisitos
- [Node.js](https://nodejs.org/) **20.19 ou superior** _(o Render usa a 22, recomendada)_ e npm
- Git
- Um **token da API Olho Vivo** da SPTrans, para ver ônibus reais. Sem ele o site abre normalmente, mas o servidor responde erro nas consultas de ônibus. Cadastre-se no [portal de desenvolvedores da SPTrans](https://www.sptrans.com.br/desenvolvedores/) para gerar o seu.
- _(Opcional)_ Um MongoDB (ex.: [MongoDB Atlas](https://www.mongodb.com/atlas), plano gratuito) para contas de usuário e exibições próprias

### Passo a passo
1. Clone ou baixe o repositório
   - Com o git instalado, rode `git clone https://github.com/Mateus-SR/Busca-Bus-React.git` e entre na pasta.
2. Instale as dependências de **todo o monorepo**, a partir da raiz:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente _(os arquivos `.env*` são ignorados pelo Git; nunca coloque credenciais no repositório)_
   - **Servidor:** crie um arquivo `.env` na **raiz** do projeto:
     ```env
     # Token da API Olho Vivo (suficiente para o teste local)
     SPTRANS_DEFAULT_TOKEN="<seu token da API Olho Vivo>"
     ```
   - **Site:** crie o arquivo `apps/web/.env.local` para o site falar com o servidor:
     ```env
     NEXT_PUBLIC_API_URL="http://localhost:4000"
     ```
     Sem essa variável, o site funciona **apenas com dados fictícios** (fixtures), sem WebSocket.
4. Inicie o servidor (em um terminal):
   ```bash
   npm run dev:server
   ```
   - O backend estará em `http://localhost:4000`.
   - Sem `JWT_SECRET` e `MONGODB_URI`, o servidor sobe mesmo assim e avisa no console que login e banco estão desabilitados.
5. Inicie o site (em **outro** terminal):
   ```bash
   npm run dev
   ```
   - O site estará em `http://localhost:3000`.
6. Teste a integração:
   - `http://localhost:4000/v1/health` deve responder `{"ok":true,...}`.
   - Abra `http://localhost:3000/exibicao/dev` para ver a **exibição de teste local**, que usa a parada `650004840`. Ela só existe enquanto o `MONGODB_URI` **não** estiver configurado _(o alias `testes` também é aceito pelo servidor)_. Digite a URL direto no navegador: o campo da tela inicial exige 6 caracteres.
   - Para conferir a SPTrans pelo servidor, sem o site:
     ```text
     GET http://localhost:4000/v1/paradas/650004840/validar
     GET http://localhost:4000/v1/exibicoes/dev/radar
     ```

> Com `NEXT_PUBLIC_API_URL` definida, a exibição `dev` usa a SPTrans real. As exibições `UpilXc`, `Busca1` e `Fatec2` (dados de demonstração do site) usam as paradas definidas em `apps/web/src/lib/fixtures/exibicoesFixture.js`, e a SPTrans pode não reconhecer todos esses códigos. Se existirem no MongoDB, os dados do banco substituem os da fixture.

### Rodando com banco de dados (opcional)
Para ter exibições próprias e contas de usuário, acrescente ao `.env` da raiz:
```env
MONGODB_URI="<sua string de conexão do MongoDB>"
JWT_SECRET="<um segredo longo e aleatório>"
```
O servidor cria os índices necessários ao iniciar. Veja o [formato das exibições](#exibições-no-mongodb).

## Variáveis de ambiente

### Servidor (`.env` na raiz do repositório)
| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `SPTRANS_DEFAULT_TOKEN` | Para ônibus reais | — | Token da API Olho Vivo. Usado só pelo servidor. |
| `MONGODB_URI` | **Sim, em produção** | — | String de conexão do MongoDB. Sem ela, as rotas de banco respondem 503 e só a exibição de teste local funciona. |
| `JWT_SECRET` | **Sim, em produção** | — | Segredo de assinatura dos tokens de login. Sem ele, a autenticação fica desabilitada. |
| `ALLOWED_ORIGINS` | **Sim, em produção** | _(qualquer origem)_ | Origens permitidas pelo CORS, separadas por vírgula, **sem barra final** (ex.: `https://meu-site.onrender.com`). |
| `NODE_ENV` | Não | `development` | Em `production`, as três variáveis acima passam a ser obrigatórias. |
| `PORT` / `HOST` | Não | `4000` / `0.0.0.0` | Porta e endereço do servidor. |
| `SPTRANS_BASE_URL` | Não | `https://api.olhovivo.sptrans.com.br/v2.1` | Endereço base da API Olho Vivo. |
| `SPTRANS_TIMEOUT_MS` | Não | `10000` | Tempo limite das chamadas à SPTrans. |
| `POLL_INTERVALO_MS` | Não | `5000` | Intervalo entre consultas por parada. |
| `COALESCING_MS` | Não | `500` | Janela para juntar as paradas de uma exibição em um único snapshot. |
| `SIMULACAO_FALHAS` | Não | ligada fora de produção | `1` liga e `0` desliga o simulador de falhas (veja abaixo). Em produção só liga se for `1`. |
| `TEST_DISPLAY_CODE` | Não | `dev` | Código da exibição de teste local (sem MongoDB). |
| `TEST_STOP_CODE` / `TEST_STOP_CODES` | Não | `650004840` | Parada(s) da exibição de teste local; `TEST_STOP_CODES` aceita vários códigos separados por vírgula. |
| `ENCRYPTION_KEY`, `APP_URL` | Não | — | Reservadas para recursos futuros; o servidor atual lê, mas ainda não usa. |

### Site (`apps/web/.env.local`, ou variável do ambiente de build)
| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Para tempo real | URL do servidor (ex.: `http://localhost:4000`). **É embutida no build**: depois de alterá-la, é preciso gerar o site de novo. |

## Painel "Detalhes técnicos" e simulação de falhas
Em qualquer exibição, o painel oculto **"Detalhes técnicos"** abre pelo botão abaixo do código da exibição ou com **Ctrl + Shift + D**. Ele só coleta diagnóstico enquanto está aberto, guarda os últimos 30 snapshots, nunca mostra o token ou o cookie da SPTrans e permite limpar o histórico ou forçar uma atualização. Com o Socket.IO conectado, mostra também clientes conectados, salas ativas, entradas/saídas, snapshots enviados e o histórico de quedas e reconexões.

Com o **simulador de falhas** habilitado (padrão fora de produção), o painel também permite injetar problemas entre o servidor e a SPTrans, que expiram sozinhos (padrão 60 s, máximo 10 min):

| Cenário | O que simula |
|---|---|
| `rede` | Sem internet |
| `timeout` | SPTrans não responde |
| `erro500` | SPTrans com erro 500 |
| `lenta` | SPTrans lenta (+3 s) |
| `vazia` | Resposta sem previsões |
| `json_invalido` | HTML no lugar de JSON |
| _queda do socket_ | Derruba só o WebSocket, para testar a reconexão |

> O simulador afeta **todas as salas** do servidor. Em produção deixe-o desligado (não defina `SIMULACAO_FALHAS=1`).

## Hospedagem

O repositório já traz um **Blueprint do Render** (`render.yaml`, na raiz) com dois serviços: o **site estático** (`busca-bus-web`) e o **servidor** (`busca-bus-server`, plano gratuito).

### Passo a passo no Render
1. Crie um banco gratuito no [MongoDB Atlas](https://www.mongodb.com/atlas) e copie a string de conexão (`MONGODB_URI`). Em **Network Access**, permita a conexão do Render: no plano gratuito os IPs de saída mudam, então costuma-se liberar `0.0.0.0/0`. Nesse caso, use um usuário de banco com senha forte.
2. No [Render](https://render.com/): **New → Blueprint**, conecte este repositório e confirme. Os dois serviços são criados a partir do `render.yaml`.
3. No serviço **busca-bus-server**, preencha as variáveis marcadas como `sync: false`:
   - `MONGODB_URI`: a string do passo 1.
   - `SPTRANS_DEFAULT_TOKEN`: seu token do Olho Vivo.
   - `ALLOWED_ORIGINS`: a URL do site estático (ex.: `https://busca-bus-web.onrender.com`, sem barra final).
   - `ENCRYPTION_KEY`, `APP_URL`, `EMAIL_API_KEY`: podem ficar em branco por enquanto (reservadas).
   - `JWT_SECRET` é gerada automaticamente pelo Render.
4. Quando o servidor estiver no ar, copie a URL dele (ex.: `https://busca-bus-server.onrender.com`) e, no serviço **busca-bus-web**, defina `NEXT_PUBLIC_API_URL` com essa URL.
5. Faça um **novo deploy** do site (a variável é embutida no build do Next.js).
6. Confirme em `https://<seu-servidor>/v1/health` (é o mesmo endereço usado pelo health check do Render).

Observações do Blueprint:
- **Não use `rootDir`**: os serviços dependem de `packages/core` e do `package-lock.json` da raiz. O `buildFilter` evita deploys desnecessários.
- Só pode existir **um** web service gratuito rodando 24/7 por workspace do Render; não crie um segundo (staging, teste).
- No plano gratuito, o servidor **hiberna após um período sem tráfego**, e a primeira visita depois disso demora alguns segundos a mais.

### Em outra hospedagem
- **Site:** o `next.config.mjs` usa `output: "export"`, ou seja, gera um site 100% estático. Rode `npm ci && npm run build` com `NEXT_PUBLIC_API_URL` definida e publique a pasta **`apps/web/out`** em qualquer hospedagem estática (Netlify, Cloudflare Pages, Vercel, GitHub Pages...). Para publicar em um subcaminho (ex.: GitHub Pages de projeto) é preciso configurar `basePath` no `next.config.mjs`.
- **Servidor:** qualquer hospedagem de Node.js que aceite **WebSocket** e processo de longa duração (não serve para funções serverless). Rode `npm ci` e `npm run start:server`, com as variáveis de ambiente definidas e `NODE_ENV=production`.
- Para ver o build do site localmente, use `npx serve apps/web/out`. **`npm run start` não funciona** neste projeto, porque o `next start` não aceita `output: "export"`.

## Como modificar

| Quero mudar... | Onde mexer |
|---|---|
| Uma tela ou rota do site | `apps/web/src/app/(site)/...` (públicas) ou `(auth)/...` (login/cadastro) |
| Layout e componentes visuais | `apps/web/src/components/<domínio>/` |
| Cores, fontes e animações | `apps/web/src/app/globals.css` (Tailwind v4 configurado via `@theme`; a cor da marca é `sptrans`) |
| Como o site recebe os ônibus (WebSocket e fallback REST) | `apps/web/src/hooks/useRadarOnibus.js` |
| Exibições de demonstração do site | `apps/web/src/lib/fixtures/exibicoesFixture.js` |
| Regras de status (atrasado/adiantado) | `packages/core/src/status.js` |
| Nomes dos eventos do socket | `packages/core/src/eventos.js` _(usados por site e servidor)_ |
| Intervalo padrão de coleta | `packages/core/src/intervalos.js` (ou `POLL_INTERVALO_MS`) |
| Integração com a SPTrans | `apps/server/src/sptrans/` |
| Consulta e cache por parada | `apps/server/src/realtime/poller.js` |
| Salas, limites e snapshots do WebSocket | `apps/server/src/realtime/socket.js` |
| Rotas REST | `apps/server/src/http/routes/` |

Convenções (mais detalhes em [CLAUDE.md](CLAUDE.md)):
- Textos da interface e nomes de variáveis/funções em **português** (`codigo`, `erro`, `estaLogado`, `handleAcessar`).
- Componentes que usam estado, efeitos ou APIs do navegador precisam de `"use client"`; os demais são Server Components.
- Use o alias `@/*` para importar de `apps/web/src/*`.
- O Leaflet só roda no navegador; o mapa é carregado com `next/dynamic` e `ssr: false`.
- Estilo de código: Prettier (`.prettierrc`: tabs, aspas simples, `prettier-plugin-tailwindcss`).
- Fixtures são dados fictícios e temporários: nunca coloque credenciais ou tokens reais nelas.

### Exibições no MongoDB
As exibições ficam na coleção `exibicoes` (o banco é o definido na `MONGODB_URI`). **Ainda não existe rota para criá-las**: por enquanto, insira o documento manualmente (mongosh, Compass ou Atlas):

```json
{
  "codigo": "UpilXc",
  "nome": "Fatec Zona Leste",
  "paradas": ["650004840", "650004841"],
  "config": {
    "tempoAtraso": 2,
    "tempoAdiantado": 2,
    "distanciaMaxMin": 20,
    "permitirMultiplosPorLinha": false
  },
  "ativo": true,
  "criadoEm": "2026-01-01T00:00:00.000Z"
}
```

| Campo | Significado |
|---|---|
| `codigo` | Código de acesso (letras, números, `_` ou `-`; a tela inicial exige 6 caracteres) |
| `paradas` | Códigos de parada da SPTrans (7 a 9 dígitos; no máximo 8 por exibição) |
| `tempoAtraso` / `tempoAdiantado` | Minutos de diferença para marcar o ônibus como Atrasado / Adiantado (0 a 120) |
| `distanciaMaxMin` | Só mostra ônibus que chegam em até X minutos (0 a 180) |
| `permitirMultiplosPorLinha` | `false`: mostra só o próximo ônibus de cada linha; `true`: mostra todos |
| `ativo` | `false` esconde a exibição sem apagá-la |

Para a exibição aparecer **no site hospedado**, o código também precisa estar em `apps/web/src/lib/fixtures/exibicoesFixture.js` (veja as [limitações](#estado-atual-e-limitações-conhecidas)).

## Referência da API

### REST (`/v1`)
Limite geral de 120 requisições por minuto por IP; as rotas de autenticação têm limite próprio.

| Método e rota | Descrição |
|---|---|
| `GET /v1/health` | Estado do servidor (versão, ambiente, banco, memória) |
| `GET /v1/paradas/:codigo/validar` | Confere se a SPTrans responde para o código da parada |
| `GET /v1/exibicoes/:codigo` | Dados de uma exibição |
| `GET /v1/exibicoes/:codigo/radar` | Snapshot atual (contingência do WebSocket). Aceita `?diagnostico=1` e `?permitirMultiplosPorLinha=true\|false` |
| `POST /v1/auth/cadastro`, `POST /v1/auth/login` | Criar conta e entrar (exigem `MONGODB_URI` e `JWT_SECRET`) |
| `/v1/auth/refresh`, `/v1/auth/reset-senha`, `/v1/me/*` | **Ainda não implementados** (respondem 501) |

### Socket.IO
Os nomes dos eventos ficam em `packages/core/src/eventos.js`.

| Evento | Direção | Uso |
|---|---|---|
| `exibicao:entrar` | cliente → servidor | Entra na sala: `{ codigo, paradas, config, diagnostico }` |
| `exibicao:configurar` | cliente → servidor | Altera a configuração da sala |
| `exibicao:diagnostico` | cliente → servidor | Liga/desliga o bloco de diagnóstico para aquele navegador |
| `exibicao:simular` | cliente → servidor | Aciona um cenário de falha (só com o painel aberto e o simulador ligado) |
| `exibicao:sair` | cliente → servidor | Sai da sala |
| `heartbeat` | cliente → servidor | Confirma que a conexão está viva |
| `exibicao:snapshot` | servidor → cliente | Lista atual de ônibus, ponto(s), configuração e estado da conexão |
| `servidor:aviso` | servidor → cliente | Avisos do servidor (ex.: reiniciando) |

Limites por conexão: 30 eventos a cada 10 s e mensagens de até 64 KB.

## Estado atual e limitações conhecidas
- **Páginas do site são estáticas.** `apps/web/src/app/(site)/exibicao/[codigo]` (e `configuracao/[codigo]`, `exibicao/[codigo]/mapa`) usam `generateStaticParams` com as exibições de demonstração (`UpilXc`, `Busca1`, `Fatec2`) e `dev`. Um código novo criado só no MongoDB **não ganha página no site hospedado** até ser incluído nesse arquivo e o site ser gerado de novo.
- **Login do site é simulado.** O `AuthContext` usa um usuário de mentira guardado no `localStorage`. A API de login existe no servidor, mas o site ainda não a usa.
- **Favoritos, configuração, listas e mapa usam fixtures** (`apps/web/src/lib/fixtures/`). Sem `NEXT_PUBLIC_API_URL`, a exibição também mostra ônibus fictícios.
- **Sem rota para criar exibições** (veja [Exibições no MongoDB](#exibições-no-mongodb)); recuperação de senha e renovação de sessão ainda não estão implementadas.
- **`apps/mobile` é só um esqueleto** (componentes e stores iniciais); ainda não há app para executar.
- **Não há testes automatizados** configurados. A validação é feita com lint, build e verificação manual.

## Comandos
Todos rodam a partir da raiz do repositório.

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências de todo o monorepo |
| `npm run dev` | Site em modo de desenvolvimento (`http://localhost:3000`) |
| `npm run dev:server` | Servidor em modo de desenvolvimento, com reinício automático (`http://localhost:4000`) |
| `npm run build` | Gera o site estático em `apps/web/out` |
| `npm run build:server` | Verifica a sintaxe do servidor (`node --check`; não há etapa de compilação) |
| `npm run start:server` | Inicia o servidor (produção) |
| `npm run lint` | ESLint do site |

Antes de abrir um pull request, rode `npm run lint`, `npm run build` e `npm run build:server`.

## Referências
- [CLAUDE.md](CLAUDE.md): arquitetura e convenções detalhadas
- [AGENTS.md](AGENTS.md): instruções para agentes de IA
- [API Olho Vivo (SPTrans)](https://www.sptrans.com.br/desenvolvedores/api-do-olho-vivo-guia-de-referencia)
- [Repositório antigo (Jekyll + Supabase)](https://github.com/Mateus-SR/Sistema-Monitoramento-Linhas-Onibus)
