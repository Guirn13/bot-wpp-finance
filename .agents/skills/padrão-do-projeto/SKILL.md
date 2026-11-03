---
name: architecture
description: Use when creating, modifying, reviewing, or refactoring backend code in this repository. Defines architectural boundaries, Hexagonal Architecture, Domain-Driven Design principles, Supabase integration, TypeScript conventions, testing, and code quality standards.
---

# Architecture & Backend Code Style

## 1. Architectural Principles

- Follow **Hexagonal Architecture (Ports & Adapters)** as the primary architectural pattern.
- Apply **Clean Architecture**, **SOLID**, **Clean Code**, and **Domain-Driven Design (DDD)** principles where appropriate.
- The business domain must remain independent of frameworks, databases, messaging providers, and external APIs.
- Dependencies must always point inward, toward the domain and application layers.
- External integrations must be accessed exclusively through defined ports (interfaces).
- Adapters are responsible for implementing ports and translating external data into application contracts.
- Prefer composition over inheritance.
- Avoid unnecessary abstractions and premature generalization.

## 2. Project Structure

Organize the application by business responsibility, keeping domain, application, and infrastructure concerns separated.

```text
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   ├── services/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   ├── ports/
│   │   ├── inbound/
│   │   └── outbound/
│   ├── dto/
│   └── services/
│
├── infrastructure/
│   ├── database/
│   │   └── supabase/
│   ├── messaging/
│   │   └── whatsapp/
│   ├── ai/
│   ├── config/
│   └── logging/
│
├── presentation/
│   ├── whatsapp/
│   ├── controllers/
│   └── handlers/
│
├── shared/
│   ├── types/
│   └── utils/
│
└── main.ts
```

Responsibilities:

- **Domain:** Business entities, financial rules, value objects, domain services, and domain errors.
- **Application:** Use cases, orchestration, application DTOs, and port definitions.
- **Infrastructure:** Concrete implementations of database, WhatsApp, AI providers, logging, and external services.
- **Presentation:** Receives external events, validates inputs, and invokes application use cases.
- **Shared:** Only genuinely reusable technical utilities and types.

Do not move business rules into infrastructure or presentation layers.

## 3. Dependency Rules

Follow these dependency constraints:

- Domain must not import application, infrastructure, or presentation.
- Application may depend on domain and its own ports.
- Infrastructure may implement application ports and depend on domain contracts.
- Presentation may invoke application use cases but must not implement business rules.
- The composition root (`main.ts`) is responsible for instantiating dependencies and connecting implementations to their interfaces.

**Forbidden dependencies:**

- Domain importing `@supabase/supabase-js`.
- Domain importing `whatsapp-web.js`.
- Use cases directly accessing Supabase clients.
- Business rules inside WhatsApp event handlers.
- Infrastructure classes importing presentation handlers.

## 4. Domain Layer

- Domain entities must represent business concepts, not database tables.
- Use value objects for concepts that require validation or encapsulated behavior.
- Financial calculations must belong to domain services or appropriate domain entities.
- Use explicit types for monetary values.
- Avoid floating-point arithmetic for financial calculations. Prefer integer values in cents.
- Validate domain invariants when creating or modifying entities.
- Domain errors must represent meaningful business failures.

Examples of domain concepts:

- Transaction
- Category
- Account
- User
- FinancialSummary
- Money
- TransactionType

Domain entities must not know how data is persisted or how messages are delivered.

## 5. Application Layer & Use Cases

- Each use case must represent a specific application action.
- Use cases coordinate domain objects and external ports.
- Keep use cases focused on a single responsibility.
- Inject dependencies through constructors or explicit function parameters.
- Never instantiate infrastructure implementations inside use cases.
- Define explicit input and output DTOs.
- Validate application inputs before executing business operations.
- Handle expected business failures explicitly.
- Avoid exposing infrastructure-specific errors to the presentation layer.

Examples:

- CreateTransactionUseCase
- UpdateTransactionUseCase
- DeleteTransactionUseCase
- ListTransactionsUseCase
- GetFinancialSummaryUseCase
- ProcessIncomingMessageUseCase

## 6. Ports & Adapters

- Define interfaces based on application requirements, not on the methods provided by external libraries.
- Keep ports independent of their implementations.
- Implement each port through an appropriate adapter.
- Adapters must translate between application contracts and external provider contracts.
- Avoid exposing Supabase response objects or WhatsApp-specific types outside infrastructure.

Examples of outbound ports:

- TransactionRepository
- UserRepository
- MessageGateway
- AIProvider
- ClockProvider

Examples of adapters:

- SupabaseTransactionRepository
- SupabaseUserRepository
- WhatsAppMessageAdapter
- OpenAIAdapter

The application must be able to replace Supabase, WhatsApp, or the AI provider without modifying its business rules.

## 7. Supabase & Database

- Use Supabase PostgreSQL as the persistence provider.
- Keep Supabase client initialization centralized inside infrastructure.
- All database access must happen through repository adapters.
- Never access Supabase directly from use cases, domain entities, or presentation handlers.
- Keep database models separate from domain entities.
- Map database records into domain objects through explicit mappers.
- Use migrations to manage schema changes.
- Define appropriate primary keys, foreign keys, constraints, and indexes.
- Apply Row Level Security (RLS) whenever applicable.
- Never expose the service role key to client-facing code.
- Store credentials in environment variables.
- Handle database errors and translate them into application-level errors.

## 8. WhatsApp Integration

- Treat WhatsApp as an external messaging provider.
- WhatsApp events must be handled by presentation adapters.
- Event handlers must only receive messages, perform basic input validation, and invoke the appropriate use case.
- Do not implement financial rules inside WhatsApp handlers.
- Sending messages must happen through the MessageGateway port.
- Do not expose `whatsapp-web.js` types outside the WhatsApp adapter.
- Keep message formatting and provider-specific payload conversion inside the messaging infrastructure.

## 9. AI Integration

- AI providers must be accessed through an AIProvider port.
- Do not couple use cases to a specific LLM SDK.
- Treat LLM responses as untrusted input.
- Validate and normalize structured AI outputs before passing them to domain operations.
- Never allow the AI to execute database operations directly.
- Financial transactions must be validated by application and domain rules before persistence.
- Keep prompts and provider-specific configurations outside the domain layer.

## 10. TypeScript Standards

- Use strict TypeScript.
- Never use `any`.
- Prefer `unknown` with proper type narrowing.
- Use `import type` for type-only imports.
- Define explicit return types for public functions and interfaces.
- Avoid unnecessary type assertions.
- Prefer discriminated unions for representing multiple states.
- Use enums or literal unions consistently according to the project's existing conventions.
- Keep types close to their respective business contexts.

## 11. Code Style

- Use single quotes, no semicolons, and 2-space indentation.
- Use descriptive names for classes, interfaces, functions, and variables.
- Prefer small functions with a single responsibility.
- Keep functions deterministic whenever possible.
- Avoid deeply nested conditionals.
- Use early returns when they improve readability.
- Avoid duplicated business logic.
- No commented-out code.
- No explanatory comments in implementation code.
- Use JSDoc only when documenting public APIs or complex contracts that genuinely require clarification.
- Do not introduce abstractions without a concrete need.

## 12. Error Handling & Logging

- Use domain errors for business rule violations.
- Use application errors for use case failures.
- Translate infrastructure errors into meaningful application errors.
- Never expose database credentials, tokens, or sensitive user information in logs.
- Avoid empty catch blocks.
- Log unexpected failures with sufficient context for debugging.
- Do not use `console.log` as a permanent logging strategy.
- Avoid swallowing errors or returning fake success responses.

## 13. Testing

- Write unit tests for domain rules and application use cases.
- Test use cases independently from Supabase and WhatsApp.
- Mock outbound ports when testing application behavior.
- Test adapters separately using integration tests.
- Test financial calculations with edge cases.
- Cover invalid inputs, missing records, duplicate operations, and unexpected failures.
- Prefer behavior-based tests over implementation-detail tests.
- Ensure critical financial operations have adequate test coverage.

## 14. Environment & Configuration

- Centralize environment variable validation.
- Fail fast when required configuration is missing.
- Never hardcode credentials, API keys, or connection strings.
- Keep environment-specific configuration outside business logic.
- Provide an `.env.example` with documented variable names, but no real credentials.

## 15. Before Completing Any Task

Before considering an implementation complete:

1. Verify that dependency rules are respected.
2. Check whether business logic is located in the correct layer.
3. Confirm that external dependencies are accessed through ports.
4. Ensure adapters correctly implement their contracts.
5. Verify that Supabase-specific code remains inside infrastructure.
6. Add or update relevant tests.
7. Run TypeScript type checking.
8. Run linting and tests.
9. Review the diff for unnecessary complexity, duplicated logic, debug code, and architectural violations.

**Golden Rule:** Business rules must never depend on external technologies. Infrastructure can change; the domain must remain stable.