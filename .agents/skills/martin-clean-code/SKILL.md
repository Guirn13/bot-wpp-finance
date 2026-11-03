---
name: martin-clean-code
description: "Apply clean-code principles when naming variables or functions, simplifying logic, handling errors, reviewing code, refactoring, applying SRP/OCP/DIP, or using TDD and F.I.R.S.T. principles. Also use when the user asks about G1-G36 clean-code heuristics."
---

# Clean Code Guidance

This skill provides an original, concise summary of general clean-code principles associated with Robert C. Martin. It does not reproduce the book's text, examples, or chapter structure. The skill is independently written and is not affiliated with or endorsed by the author or publisher.

## When to Use

- Improving names, functions, control flow, error handling, or readability.
- Reviewing code for maintainability and unnecessary complexity.
- Refactoring code while preserving observable behavior.
- Discussing SRP, OCP, DIP, TDD, F.I.R.S.T., or clean-code heuristics.

## Working Approach

1. Read the surrounding code and tests first. Follow the repository's existing conventions and avoid applying principles mechanically.
2. Identify the specific source of confusion, coupling, duplication, or risk before changing code.
3. Prefer the smallest change that makes intent clear and preserves behavior.
4. Validate the change with relevant tests or checks. Add or update tests when behavior changes or a regression needs to be prevented.
5. In reviews, prioritize concrete correctness and maintainability issues; distinguish them from subjective preferences.

## Practical Principles

### Names and intent

- Choose names that communicate the role, meaning, and relevant unit or state.
- Prefer domain language already used by the project.
- Avoid misleading abbreviations, redundant prefixes, and names that differ only subtly.
- Use comments to explain important context or constraints, not to restate obvious code.

### Functions and control flow

- Keep each function focused on one coherent responsibility at its current level of abstraction.
- Prefer small, explicit inputs and outputs; avoid hidden state and surprising side effects.
- Replace deeply nested branching with clear guard clauses or well-named helpers when that improves comprehension.
- Avoid boolean mode parameters when separate, clearly named operations better express distinct behavior.
- Do not extract helpers or introduce abstractions unless they clarify intent, remove meaningful duplication, or create a useful boundary.

### Errors and boundaries

- Make invalid states and failures explicit; do not silently swallow errors or return success-shaped fallbacks.
- Include useful context when propagating or translating errors, without hiding their cause.
- Validate external input at system boundaries and keep internal invariants clear.
- Keep resource cleanup and side effects visible and reliable.

### Design and change

- Use SRP as a guide to keep reasons for change cohesive, not as a demand to split every small piece into a separate type.
- Use OCP and DIP when they reduce the cost of likely change; do not add speculative extension points.
- Keep dependencies directed toward stable policy and represent external effects through clear boundaries where useful.
- Prefer straightforward solutions over cleverness, premature generalization, or unnecessary indirection.
- When refactoring, make behavior-preserving steps and keep the code buildable and testable throughout.

### Testing and review

- Prefer tests that describe observable behavior and are independent of implementation details.
- Use a test-first cycle when it fits: establish a failing example, make the smallest change, then improve the design while tests stay green.
- Keep tests focused, repeatable, and isolated from unrelated external systems unless testing an integration boundary.
- During review, explain the impact of a finding and give a concrete improvement; do not present stylistic taste as a defect.

## Heuristic References

Terms such as SRP, OCP, DIP, F.I.R.S.T., and heuristic identifiers like G1-G36 are useful shorthand when relevant to the user's question or source material. Do not invent mappings or reproduce source text; explain the underlying idea in original wording and in the context of the code being discussed.
