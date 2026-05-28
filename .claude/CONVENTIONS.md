# Project Conventions

**Last Updated:** 2026-05-28 01:04:28 +07:00

---

## File & Folder Naming

### Files

- Components: lowercase or kebab-case component files in UI apps, usually `.tsx`; examples include `button.tsx`, `email-signup.tsx`, `workspace-picker.tsx`, `model-section.tsx`.
- Styles: colocated `.css` for shared components and marketing routes; `.module.css` for scoped route sections.
- Utilities: lowercase or kebab-case `.ts`; examples include `format-reset-time.ts`, `effect-flock.ts`, `opencode-process.ts`.
- Constants: colocated `.constants.ts` where needed; example `agent-plugin.constants.ts`.
- Types and schemas: domain-specific `schema.ts`, `*.sql.ts`, and exported Effect Schema definitions near the owning domain.
- Tests: `*.test.ts` and `*.test.tsx`, colocated under package `test` directories or source/component directories.

### Folders

- Monorepo packages live under `packages/*`, `packages/console/*`, `packages/stats/*`, plus `packages/sdk/js`.
- Main runtime domains are organized by concept under `packages/opencode/src`, such as `session`, `config`, `server`, `tool`, `provider`, `plugin`, `storage`, `project`, and `permission`.
- Console app routes follow file-based route folders under `packages/console/app/src/routes`.
- Shared UI components live under `packages/ui/src/components` with related CSS, tests, and Storybook stories.

**Examples:**

```text
packages/opencode/src/session/session.ts
packages/opencode/src/session/session.sql.ts
packages/opencode/src/config/config.ts
packages/console/app/src/routes/workspace/[id]/billing/billing-section.tsx
packages/console/app/src/routes/workspace/[id]/billing/billing-section.module.css
packages/ui/src/components/button.tsx
packages/ui/src/components/button.css
packages/ui/src/components/button.stories.tsx
packages/ui/src/components/apply-patch-file.test.ts
```

---

## Component Structure

### Functional Component Template

```typescript
import { Button as Kobalte } from "@kobalte/core/button"
import { type ComponentProps, Show, splitProps } from "solid-js"
import { Icon, IconProps } from "./icon"

export interface ButtonProps
  extends ComponentProps<typeof Kobalte>,
    Pick<ComponentProps<"button">, "class" | "classList" | "children"> {
  size?: "small" | "normal" | "large"
  variant?: "primary" | "secondary" | "ghost"
  icon?: IconProps["name"]
}

export function Button(props: ButtonProps) {
  const [split, rest] = splitProps(props, ["variant", "size", "icon", "class", "classList"])
  return (
    <Kobalte
      {...rest}
      data-component="button"
      data-size={split.size || "normal"}
      data-variant={split.variant || "secondary"}
      data-icon={split.icon}
      classList={{
        ...split.classList,
        [split.class ?? ""]: !!split.class,
      }}
    >
      <Show when={split.icon}>
        <Icon name={split.icon!} size="small" />
      </Show>
      {props.children}
    </Kobalte>
  )
}
```

### Component Organization

```text
packages/ui/src/components/
|-- component-name.tsx
|-- component-name.css
|-- component-name.test.ts
`-- component-name.stories.tsx
```

Route-level console components often live beside their route:

```text
packages/console/app/src/routes/workspace/[id]/billing/
|-- index.tsx
|-- billing-section.tsx
|-- billing-section.module.css
|-- payment-section.tsx
`-- payment-section.module.css
```

---

## Code Style

### Imports Order

Observed code generally groups imports by practical dependency and local ownership rather than strict alphabetical blocks:

```typescript
// Package imports
import { Effect, Schema } from "effect"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

// Workspace imports
import { serviceUse } from "@opencode-ai/core/effect/service-use"
import type { MessageV2 } from "../session/message-v2"

// Local imports
import { Database } from "@/storage/db"
import { SessionID } from "./schema"
```

Use type-only imports for types when the file already follows that pattern.

### Spacing & Formatting

- Indentation: 2 spaces.
- Line length: Prettier print width is 120.
- Quotes: double quotes.
- Semicolons: omitted.
- Trailing commas: used where Prettier inserts them.
- Prefer `const` and early returns.
- Avoid unnecessary destructuring; dot notation is preferred when it preserves context.
- Keep logic inline unless extraction names a real concept or supports multiple call sites.

---

## TypeScript Conventions

### Type Definitions

- Use exported interfaces for service boundaries and component props when those are public API.
- Use `type` aliases for inferred rows, unions, and local helper shapes.
- Use Effect `Schema` for runtime-validated domain types.
- Rely on inference when possible; avoid explicit annotations that do not improve exported API clarity.
- Avoid `any`; existing legacy or upstream-boundary usage should not be copied unless needed.

**Examples:**

```typescript
export interface Interface {
  readonly get: () => Effect.Effect<Info>
  readonly update: (config: Info) => Effect.Effect<void>
}

export const Info = Schema.Struct({
  id: SessionID,
  title: Schema.String,
}).annotate({ identifier: "Session" })
export type Info = Types.DeepMutable<Schema.Schema.Type<typeof Info>>
```

### Type Imports

```typescript
import type { SQL } from "drizzle-orm"
import type { ComponentProps } from "solid-js"
```

---

## CSS/Styling Conventions

### Class and Attribute Naming

- Shared UI components prefer attributes over class-heavy selectors.
- Common attributes: `data-component`, `data-slot`, `data-variant`, `data-size`, `data-selected`, `data-active`.
- CSS variables provide tokens for color, radius, shadows, fonts, and spacing.
- CSS Modules use kebab-case filenames and route-specific classes when local scoping is useful.

**Example:**

```css
[data-component="button"] {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-md);
}

[data-component="button"][data-variant="primary"] {
  background-color: var(--button-primary-base);
  color: var(--icon-invert-base);
}
```

### File Organization

- Shared component styles are colocated in `packages/ui/src/components`.
- Console global styles and design tokens are under `packages/console/app/src/style`.
- App-level styles are under package `src` folders and imported by app roots.

---

## Naming Conventions

### Variables

- Variables and functions: `camelCase`.
- Types, interfaces, schemas, services, classes: `PascalCase`.
- Constants: local `camelCase` for ordinary constants; `UPPER_CASE` is not the default.
- Database columns in Drizzle schema: snake_case field names.
- Event handler functions in components: `handleCopyClick`, `on...` props from frameworks/libraries.

### Functions

- Domain service methods use verb names: `create`, `fork`, `touch`, `get`, `setTitle`, `setArchived`, `messages`.
- Helper functions name concrete concepts: `fromRow`, `toRow`, `createDefaultTitle`, `sessionPath`, `cancelBackgroundJobs`.
- Effect functions often use `Effect.fn("Domain.method")` for traceable names.

---

## Testing

### Test File Naming

```text
*.test.ts
*.test.tsx
```

### Test Structure

Tests are package-local. Root `bun test` is intentionally blocked.

```bash
cd packages/opencode && bun test
cd packages/core && bun test
cd packages/app && bun run test:unit
cd packages/app && bun run test:e2e
cd packages/ui && bun test
```

Prefer tests against actual implementation. Avoid mocks unless an external boundary makes them necessary.

---

## Do / Don't

### Do

- Use Bun APIs where practical, such as `Bun.file()`.
- Run `bun typecheck` from package directories for touched packages.
- Use package-local test commands.
- Use Effect schemas/helpers for untrusted JSON parsing and runtime validation.
- Keep helpers close to the code they support.
- Preserve project-specific command and commit conventions from `AGENTS.md`.
- Use `dev` or `origin/dev` when a branch diff is needed.

### Don't

- Do not run `bun test` from the repository root.
- Do not run `tsc` directly for type checking.
- Do not introduce `any` casually.
- Do not extract single-use helpers preemptively.
- Do not add changelog/history sections to PROJECT_SUMMARY.md.
- Do not read all of `.understand-anything/knowledge-graph.json`; use targeted `rg`.
- Do not use local `main` as an assumed diff base.

---

**NOTE:** These conventions are derived from existing code patterns and `AGENTS.md`. When in doubt, follow the nearest similar file.
