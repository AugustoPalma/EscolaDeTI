# meu-app-web — Painel Administrativo (Escola de TI)

Painel de retaguarda da plataforma de negociação segura, em **Vite + React + Tailwind**, ligado diretamente ao mesmo Supabase usado pelo app mobile.

## O que mostra

- **Painel** — métricas (entregas concluídas, agendamentos ativos, horários livres, mensagens) e o fluxo de entregas Livre → Confirmado → Concluído.
- **Utilizadores** — compradores e vendedores. Lê a tabela `usuarios` se existir; caso contrário, deriva a lista das interações reais.
- **Transações** — agendamentos com estado, horário e token de validação do QR Code, com filtros.
- **Mensagens** — conversas por sala, já com e‑mails/telefones censurados pelo filtro de privacidade.

Os dados vêm das tabelas `mensagens`, `janelas_disponibilidade`, `agendamentos` e (opcional) `usuarios`. A tela atualiza sozinha a cada 8 segundos.

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/`.

## Publicar no Netlify

**Opção A — via Git (recomendado):** conecte o repositório no Netlify. O `netlify.toml` já define:
- Build command: `npm run build`
- Publish directory: `dist`

**Opção B — arrastar e soltar:** rode `npm run build` e arraste a pasta `dist/` para o Netlify Drop (netlify.com/drop).

## Configuração

A URL e a chave pública do Supabase ficam em `src/supabaseClient.js`. É a mesma chave `publishable` do app mobile — pode movê-la para um arquivo `.env` (prefixo `VITE_`) se preferir.
