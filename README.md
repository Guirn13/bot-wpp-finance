
# Bot Controle de Gastos WPP

Um bot para WhatsApp desenvolvido em JavaScript utilizando a biblioteca `whatsapp-web.js`. Este bot permite automatizar interações com o WhatsApp Web, facilitando o envio de mensagens e outras funcionalidades.

## 🧠 O que o bot faz

Este bot atua como um assistente pessoal de **registro e controle de gastos** diretamente pelo WhatsApp. Comandos disponíveis:

- `gasto: categoria valor` — Registra um novo gasto. Exemplo: `gasto: mercado 120.50` (aceita vírgula: `gasto: comida fora 50,00`)
- `!dia` — Mostra o resumo dos gastos de hoje
- `!semana` — Mostra o resumo dos gastos da semana
- `!mes` — Mostra o resumo dos gastos do mês
- `!ajuda` — Exibe os comandos disponíveis

## 🚀 Tecnologias

- JavaScript / Node.js (>= 22)
- whatsapp-web.js
- Supabase (PostgreSQL)

## 🏛️ Arquitetura

O projeto segue a **Arquitetura Hexagonal (Ports & Adapters)**:

- `src/domain/` — entidades (`Gasto`, `Usuario`), value object `Periodo` e erros de domínio. Sem dependências externas.
- `src/application/` — casos de uso (`RegistrarGastoUseCase`, `ObterResumoGastosUseCase`) e portas (`ports/in`, `ports/out`).
- `src/infra/database/` — adaptadores Supabase e in-memory (testes).
- `src/infra/whatsapp/` — cliente do WhatsApp, roteador de comandos e presenter das mensagens.
- `index.js` — Composition Root (injeção de dependências).

## 📦 Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/Guirn13/bot-wpp.git
   ```

2. Navegue até o diretório do projeto:

   ```bash
   cd bot-wpp
   ```

3. Instale as dependências:

   ```bash
   npm install
   ```

4. No Supabase, execute o script [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.

5. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_KEY` (chave `service_role`).

## 🔧 Como Usar

1. Inicie o bot:

   ```bash
   npm start
   ```

2. O bot irá exibir um QrCode no terminal. Escaneie o QR code com o seu aplicativo do WhatsApp para autenticar.

3. Após a autenticação, o bot estará pronto para automatizar as interações com o WhatsApp.

## 🧪 Testes

```bash
npm test
```

## 🔄 Migração do `db.json` legado

```bash
npm run migrate:db-json -- --dry-run   # apenas valida
npm run migrate:db-json                # grava no Supabase (não é idempotente)
```

## 📄 Documentação

Para mais informações sobre a biblioteca `whatsapp-web.js`, consulte a [documentação oficial](https://docs.wwebjs.dev/).
