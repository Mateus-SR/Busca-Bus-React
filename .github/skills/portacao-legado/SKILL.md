---
name: portacao-legado
description: Compara um repositorio legado com um repositorio moderno e executa portacoes completas, preservando comportamento e interface, com validacao de paridade e confirmacao antes de mocks.
---

# Skill: Portacao de codigo legado

Use esta skill quando o usuario pedir para migrar paginas, componentes, estilos, scripts ou fluxos de um repositorio legado para um repositorio moderno, especialmente entre Vanilla JS/Jekyll e React/Next.js.

## Objetivo

Portar o comportamento existente com a maior fidelidade possível, sem redesenhar, simplificar arbitrariamente ou reescrever regras de negocio. A implementacao deve respeitar a arquitetura e as convencoes do repositorio novo.

O fluxo padrao e:

1. Entender o plano de migracao, se existir.
2. Inspecionar os dois repositorios.
3. Mapear cada pagina, rota, componente, script, estilo, estado, navegacao, armazenamento e dependencia externa.
4. Implementar a portacao no repositorio novo.
5. Validar a paridade e registrar incertezas, limitacoes e pendencias.

## Perguntas obrigatorias antes da execucao

Quando o pedido nao deixar claro o suficiente, pergunte individualmente:

- Qual e o repositorio legado e qual e o repositorio destino?
- Qual pagina, fluxo ou area deve ser portada?
- O escopo inclui apenas frontend ou tambem backend, autenticacao e servicos externos?

Nao faca perguntas desnecessarias quando os caminhos, escopo e objetivo ja estiverem claros.

## Regra para backend, autenticacao e servicos externos

Se uma funcionalidade depender de backend, banco, autenticacao, Supabase, APIs externas, mapas, pagamentos ou qualquer servico ainda indisponivel:

1. Pare antes de criar fixtures, mocks ou simulacoes.
2. Explique qual dependencia esta faltando e qual comportamento precisa ser decidido.
3. Faca uma pergunta de confirmacao ao usuario.
4. So implemente um mock se o usuario autorizar explicitamente.

Quando um mock for autorizado:

- mantenha o mesmo shape dos dados reais;
- use valores obviamente ficticios;
- nao inclua tokens, chaves, senhas ou credenciais realistas;
- isole o mock em fixtures, hooks ou servicos substituiveis;
- documente claramente que a implementacao e temporaria;
- preserve a assinatura esperada para facilitar a troca futura pelo servico real.

Nunca instale ou use uma dependencia externa apenas para esconder uma incerteza funcional.

## Investigacao do legado

Antes de editar:

- leia o plano de migracao e a documentacao relevante;
- verifique o estado Git dos dois repositorios;
- localize templates, layouts, includes, CSS, imagens e scripts;
- siga cada fluxo desde a rota ate eventos, chamadas de API e navegacao;
- procure usos de `window`, `document`, `localStorage`, `sessionStorage`, `innerHTML`, timers e listeners;
- identifique validacoes, mensagens, estados vazios, loading, erros e confirmacoes;
- diferencie comportamento intencional de bug legado;
- nao replique vulnerabilidades ou bugs claramente acidentais sem confirmar.

Para cada item, classifique:

- equivalente;
- parcialmente portado;
- ausente;
- intencionalmente alterado;
- bug ou regressao;
- inconclusivo.

## Regras de implementacao

- Faça alteracoes cirurgicas e completas, sem modificar arquivos fora do escopo.
- Preserve textos, hierarquia visual, espacamentos, responsividade, navegacao e estados do legado.
- Use as convencoes do repositorio novo:
  - App Router;
  - Server Components por padrao;
  - Client Components apenas para interatividade;
  - `next/link` e `next/navigation`;
  - alias `@/*`;
  - Tailwind e tokens existentes;
  - nomes coerentes com o idioma do projeto.
- Substitua manipulacao direta do DOM por estado, props, refs e efeitos React.
- Nao use `dangerouslySetInnerHTML` para reproduzir templates HTML do legado.
- Nao leia APIs do navegador durante renderizacao no servidor.
- Use `next/dynamic` com `ssr: false` para bibliotecas incompatíveis com SSR, dentro de Client Components quando exigido pelo Next.
- Reaproveite componentes, hooks e fixtures existentes antes de criar novos.
- Nao remova alteracoes locais do usuario.
- Nao crie commits, nao altere configuracoes globais e nao adicione testes ou dependencias sem necessidade justificada.

## Validacao obrigatoria

Ao concluir cada unidade de portacao:

1. Verifique as rotas implementadas e as rotas ainda ausentes.
2. Execute o lint existente.
3. Execute o build existente.
4. Verifique a interface no navegador quando houver uma pagina visual e o ambiente permitir.
5. Teste os fluxos principais, estados vazios, erros, loading, responsividade e navegacao.
6. Registre falhas de ambiente separadamente de falhas causadas pelo codigo.

Nao considere a tarefa concluida apenas porque o build passou.

## Relatorio final

Entregue:

### Resumo executivo

Descreva o que foi portado, o que ficou pendente e o nivel de fidelidade alcançado.

### Alteracoes

Liste arquivos criados ou alterados e a responsabilidade de cada um.

### Paridade

| Severidade | Area/rota | Legado | Novo | Status | Evidencia | Acao recomendada |
|---|---|---|---|---|---|---|

Use `critica`, `alta`, `media`, `baixa` ou `informativa`, ordenando por impacto.

### Incertezas e pendencias

Liste toda equivalencia nao confirmada, dependencia externa indisponivel, decisao solicitada ao usuario e comportamento que ainda exige validacao manual.

### Validacoes

Informe os comandos executados, as rotas verificadas, o resultado do lint/build e qualquer falha de ambiente.

### Proxima unidade

Recomende a menor proxima unidade de portacao que reduza o maior risco de paridade.
