# Plano de Refatoração: Arquitetura Hexagonal com Supabase

> **Objetivo:** Refatorar o bot de finanças para WhatsApp (`bot-wpp-finance`) adotando a **Arquitetura Hexagonal (Ports & Adapters)** e substituindo o banco de dados em arquivo local (`lowdb`/`db.json`) pelo **Supabase (PostgreSQL)**, garantindo desacoplamento total entre as regras financeiras, o mecanismo de mensagens do WhatsApp e o provedor de banco de dados.

---

## 1. Visão Geral da Arquitetura

Na Arquitetura Hexagonal, o coração da aplicação (Domínio e Casos de Uso) não conhece bibliotecas externas (como `whatsapp-web.js` ou `@supabase/supabase-js`). Toda comunicação externa é feita através de **Portas** (interfaces/contratos) e **Adaptadores** (implementações concretas).

```mermaid
flowchart TD
    subgraph DrivingAdapters ["Adaptadores de Entrada (Inbound / Driving)"]
        WPP["WhatsApp Client (whatsapp-web.js)"]
        Router["Command Router (!mes, gasto:, etc.)"]
        Presenter["Message Presenter (Formatação WhatsApp)"]
    end

    subgraph Core ["Núcleo da Aplicação (Application & Domain)"]
        subgraph PortsIn ["Portas de Entrada (Inbound Ports)"]
            UC1["RegistrarGastoUseCase"]
            UC2["ObterResumoGastosUseCase"]
        end

        subgraph Domain ["Domínio (Domain)"]
            EntGasto["Entidade Gasto"]
            EntUser["Entidade Usuário"]
            VOPeriodo["Value Object Periodo (dia, semana, mês)"]
        end

        subgraph PortsOut ["Portas de Saída (Outbound Ports)"]
            RepoPort["GastoRepositoryPort (Interface)"]
            UserPort["UsuarioRepositoryPort (Interface)"]
        end
    end

    subgraph DrivenAdapters ["Adaptadores de Saída (Outbound / Driven)"]
        SupaRepo["SupabaseGastoRepository"]
        SupaUser["SupabaseUsuarioRepository"]
        MemRepo["InMemoryGastoRepository (Testes)"]
    end

    WPP --> Router
    Router --> UC1
    Router --> UC2
    UC1 --> EntGasto
    UC1 --> RepoPort
    UC1 --> UserPort
    UC2 --> RepoPort
    UC2 --> VOPeriodo
    UC1 -.-> Presenter
    UC2 -.-> Presenter
    Presenter -.-> WPP

    RepoPort <|.. SupaRepo
    UserPort <|.. SupaUser
    RepoPort <|.. MemRepo
    SupaRepo --> Supabase[("Supabase (PostgreSQL)")]
```

---

## 2. Nova Estrutura de Diretórios Proposta

```text
bot-wpp-finance/
├── .agents/
│   └── plans/
│       └── hexagonal-supabase-refactor.md
├── src/
│   ├── domain/                               # Regras de Negócio Puras (Zero dependências externas)
│   │   ├── entities/
│   │   │   ├── Gasto.js                      # Entidade com id, usuarioId (UUID), categoria, valor, data
│   │   │   └── Usuario.js                    # Entidade com id (UUID), whatsappId, nome
│   │   ├── value-objects/
│   │   │   └── Periodo.js                    # Cálculo de intervalos de datas (dia, semana, mês)
│   │   └── errors/
│   │       ├── ValorInvalidoError.js
│   │       └── CategoriaInvalidaError.js
│   │
│   ├── application/                          # Casos de Uso e Contratos de Portas
│   │   ├── ports/
│   │   │   ├── in/                           # Contratos de entrada
│   │   │   │   ├── IRegistrarGastoUseCase.js
│   │   │   │   └── IObterResumoGastosUseCase.js
│   │   │   └── out/                          # Contratos de dependências (banco, etc.)
│   │   │       ├── IGastoRepository.js
│   │   │       └── IUsuarioRepository.js
│   │   └── use-cases/
│   │       ├── RegistrarGastoUseCase.js
│   │       └── ObterResumoGastosUseCase.js
│   │
│   ├── infra/                                # Implementações Concretas (Adapters)
│   │   ├── database/
│   │   │   ├── supabaseClient.js             # Conexão e inicialização do Supabase
│   │   │   ├── SupabaseGastoRepository.js    # Implementa IGastoRepository
│   │   │   ├── SupabaseUsuarioRepository.js  # Implementa IUsuarioRepository
│   │   │   └── InMemoryGastoRepository.js    # Mock para testes unitários rápidos
│   │   └── whatsapp/
│   │       ├── whatsappClient.js             # Setup do whatsapp-web.js e QRCode
│   │       ├── commandRouter.js              # Identifica comandos (!mes, !dia, gasto:)
│   │       └── messagePresenter.js           # Formata respostas em markdown/emojis
│   │
│   └── config/
│       └── env.js                            # Validação de variáveis (.env)
│
├── tests/                                    # Testes automatizados (Node Test Runner)
│   ├── domain/
│   │   └── Periodo.test.js
│   └── use-cases/
│       ├── RegistrarGastoUseCase.test.js
│       └── ObterResumoGastosUseCase.test.js
│
├── .env.example
├── index.js                                  # Composition Root (Injeção de dependências e inicialização)
└── package.json
```

---

## 3. Modelagem de Dados no Supabase (SQL DDL)

Script para criar as tabelas no Supabase com tipos adequados e índices para busca por período:

```sql
-- 1. Tabela de Usuários (com UUID surrogate key e whatsapp_id único)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_id TEXT UNIQUE NOT NULL,          -- ex: '5511999999999@c.us'
    nome TEXT NOT NULL DEFAULT 'Desconhecido',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Gastos apontando para o UUID do Usuário
CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
    data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para otimização de consultas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_whatsapp_id ON usuarios(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_gastos_usuario_data ON gastos(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
```

---

## 4. Detalhamento dos Componentes

### 4.1 Camada de Domínio (`src/domain/`)
* **`Usuario`**: Entidade com `id` (UUID), `whatsappId` e `nome`.
* **`Gasto`**: Garante que o valor seja numérico positivo e a categoria seja uma string não vazia e higienizada, vinculado a um `usuarioId` (UUID).
* **`Periodo`**: Resolve um grande ponto crítico do código legado (uso de datas UTC). Calcula `inicio` e `fim` com precisão baseando-se no fuso `America/Sao_Paulo` para os períodos `'dia'`, `'semana'` e `'mes'`.

### 4.2 Camada de Aplicação (`src/application/`)
* **`IUsuarioRepository`**:
  * `obterOuCriarPorWhatsappId(whatsappId: string, nome?: string): Promise<Usuario>`
  * `buscarPorId(id: string): Promise<Usuario | null>`
* **`IGastoRepository`**:
  * `salvar(gasto: Gasto): Promise<Gasto>`
  * `buscarPorPeriodo(usuarioId: string, inicio: Date, fim: Date): Promise<Gasto[]>`
* **`RegistrarGastoUseCase`**:
  * Resolve ou cria o `Usuario` através do `whatsappId` usando `IUsuarioRepository` (com cache de resolução em memória para evitar queries redundantes).
  * Cria e valida o `Gasto` associando ao `usuario.id` (UUID).
  * Persiste via `IGastoRepository.salvar`.
  * Retorna o DTO do gasto cadastrado.
* **`ObterResumoGastosUseCase`**:
  * Recebe `{ whatsappId, tipoPeriodo }` ('dia' | 'semana' | 'mes').
  * Obtém o `usuario.id` (UUID) correspondente ao `whatsappId`.
  * Gera o `Periodo` correspondente.
  * Delega ao repositório a busca apenas dos registros dentro do intervalo (filtragem feita no PostgreSQL via SQL, e não carregando tudo na memória).
  * Consolida: `total`, `porCategoria: { [cat]: valor }`, `quantidade`.

### 4.3 Camada de Infraestrutura (`src/infra/`)
* **Outbound (Supabase)**:
  * Consultas parametrizadas utilizando o `@supabase/supabase-js`.
  * Mapeamento de colunas snake_case do banco para as entidades em camelCase.
* **Inbound (WhatsApp)**:
  * `commandRouter.js`: Decomposição limpa do texto da mensagem. Aceita valores tanto com ponto (`50.00`) quanto com vírgula (`50,00`).
  * `messagePresenter.js`: Centraliza todas as mensagens enviadas ao usuário, mantendo o padrão visual com emojis e separando formatação de texto da regra de negócio.

### 4.4 Composition Root (`index.js`)
O ponto central que amarra as dependências (Inversão de Controle):
```javascript
// Exemplo de wiring no Composition Root:
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const gastoRepo = new SupabaseGastoRepository(supabase);
const usuarioRepo = new SupabaseUsuarioRepository(supabase);

const registrarGastoUseCase = new RegistrarGastoUseCase(gastoRepo, usuarioRepo);
const obterResumoUseCase = new ObterResumoGastosUseCase(gastoRepo);

const presenter = new WhatsappMessagePresenter();
const commandRouter = new CommandRouter({
  registrarGastoUseCase,
  obterResumoUseCase,
  presenter
});

iniciarWhatsappBot({ onMessage: (msg) => commandRouter.handle(msg) });
```

---

## 5. Roteiro de Execução Passo a Passo

| Etapa | Ação | Arquivos Envolvidos |
|---|---|---|
| **Fase 1: Preparação e Dependências** | Instalar `@supabase/supabase-js`, `dotenv`. Criar `.env.example` e módulo de validação de ambiente. | `package.json`, `.env.example`, `src/config/env.js` |
| **Fase 2: Domínio e Value Objects** | Criar entidades (`Gasto`, `Usuario`), Value Object (`Periodo`) e erros de domínio. Criar testes unitários para cálculo de datas. | `src/domain/**/*`, `tests/domain/**/*` |
| **Fase 3: Portas e Casos de Uso** | Definir interfaces (`IGastoRepository`, `IUsuarioRepository`) e implementar os casos de uso com testes unitários usando `InMemoryGastoRepository`. | `src/application/**/*`, `tests/use-cases/**/*` |
| **Fase 4: Adaptador do Supabase** | Implementar `SupabaseGastoRepository` e `SupabaseUsuarioRepository` com conversão de tipos e tratamento de erros. | `src/infra/database/**/*` |
| **Fase 5: Adaptadores do WhatsApp** | Extrair comandos para o `commandRouter` e criar o `messagePresenter` para formatação das respostas. | `src/infra/whatsapp/**/*` |
| **Fase 6: Composition Root** | Refatorar `index.js` para instanciar as camadas e injetar as dependências. | `index.js` |
| **Fase 7: Migração de Dados (Opcional)** | Criar script para migrar dados históricos do `db.json` legado para o Supabase. | `scripts/migrate-db-json.js` |

---

## 6. Critérios de Sucesso e Validação
1. **Zero dependências externas no Domínio**: Nenhuma menção a Supabase ou WhatsApp em `src/domain/` ou `src/application/`.
2. **Testabilidade**: Casos de uso e regras de data 100% testáveis sem necessidade de conexão com a internet ou WhatsApp ativo.
3. **Compatibilidade com o Usuário**: Nenhuma quebra de comandos existentes (`gasto:`, `!dia`, `!semana`, `!mes`, `!ajuda`).
4. **Resiliência a Erros**: Mensagens de erro amigáveis caso o formato esteja errado ou o banco fique instável temporariamente.

