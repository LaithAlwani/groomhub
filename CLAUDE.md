<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->


<!-- convex-ai-start -->
This project uses Convex as its backend.

When working on Convex code, ALWAYS read `convex/_generated/ai/guidelines.md` first.
These rules override any prior knowledge about Convex.

Convex agent skills can be installed via:
npx convex ai-files install
<!-- convex-ai-end -->

# 🧱 Project Standards

## 📁 File Structure & Clean Code

- Keep files **small, focused, and readable**
- ❌ Files should NOT exceed ~300 lines
- If a file grows too large:
  - Extract components
  - Extract hooks
  - Extract utilities

### Recommended breakdown:

- `components/` → UI pieces
- `features/` → business logic per domain (clients, pets, notes)
- `hooks/` → reusable logic (`useClients`, `usePets`)
- `lib/` or `utils/` → helpers
- `services/` → API / Convex calls

---

## 🧩 Component Rules

- One component = one responsibility
- Split large UI into smaller components

### ❌ Bad
- One page with everything (700+ lines)

### ✅ Good
- Page → layout + composition
- Components → reusable UI blocks

---

## 🎨 Styling (STRICT)

### Colors

- All colors MUST come from `tailwind.config.js`
- ❌ Never use:
  - raw hex (`#fff`)
  - inline styles
- ✅ Always use:
  - `bg-primary`
  - `text-text-primary`
  - `border-border`

If a color is missing:
→ Add it to `tailwind.config.js` first

---

## 🧱 Layout Consistency

- Use consistent spacing:
  - `p-4`, `p-6`, `gap-4`, `gap-6`
- Use consistent containers:
  - `rounded-2xl`
  - `shadow-card`
  - `bg-background-card`

---

## 🔁 Reusability

- If something is used **2+ times**, extract it
- Examples:
  - Buttons
  - Cards
  - Tags
  - Form inputs

---

## 🧠 State & Logic

- ❌ No heavy logic inside components
- ✅ Move logic to:
  - hooks (`useClients`)
  - services (`clientService.ts`)

---

## 🔌 Convex Usage

- All Convex calls should be abstracted
- ❌ Do NOT call mutations directly inside UI everywhere
- ✅ Use hooks/services

Example:
- `useClients()`
- `useAddNote()`

---

## 📦 Data Handling

- Always validate and normalize data
- Avoid deeply nested objects in UI
- Prefer clean, predictable structures

---

## 🐶 Domain Separation (IMPORTANT)

Keep domains separated:

- clients
- pets
- notes

Each should have:
- its own components
- its own hooks
- its own logic

---

## 🎯 Naming Conventions

- Components → `PascalCase`
- Hooks → `useSomething`
- Files → match component name

---

## 🧼 Code Cleanliness

- Remove unused code immediately
- No commented-out blocks left behind
- No console.logs in production code

---

## ⚡ Performance

- Avoid unnecessary re-renders
- Use memoization when needed
- Keep components lightweight

---

## 🧩 Icons

- All icons must use `<Icon />`
- ❌ No inline SVGs

Steps to add:
1. Add SVG to `src/assets/icons/`
2. Register in `Icon.jsx`
3. Use `<Icon name="..." />`

---

## 🚀 Scaling Rules

When adding new features:

1. Do NOT modify large files directly
2. Create new components/modules
3. Keep everything modular

---

## 🧠 Golden Rules

- Keep components small
- Keep logic separate
- Keep styling consistent
- Always use Tailwind tokens
- Always think about reuse

---

## 🔥 When in doubt

Ask:

- Can this be reused?
- Can this be split?
- Is this readable in 6 months?

If not → refactor.

---

## 🔒 Security Rules (NON-NEGOTIABLE)

This section defines the security model for GroomHub. Every developer and AI agent working on this codebase MUST follow these rules.

---

### Authentication & Sessions

- Login is handled by `convex/users.ts → login`. It verifies a SHA-256 hashed PIN against the `users` table.
- On success, `login` creates a **session token** in the `sessions` table (12-hour TTL) and returns it to the client.
- The client stores `sessionToken` in React state (`AuthContext`). It is **never** written to disk or localStorage.
- On logout, `users.logout` deletes the session from the database server-side.
- After 10 consecutive failed login attempts, the account is **locked**. Only an admin can unlock it via `users:unlockUser` (internal mutation — Convex dashboard only).

---

### Protecting Convex Mutations

**Every mutation that writes data MUST verify a session token.**

Use the helpers in `convex/sessions.ts`:

```ts
// Any logged-in user
const user = await requireSession(ctx, args.sessionToken);

// Admins only (e.g. importBatch, user management)
const user = await requireAdmin(ctx, args.sessionToken);
```

- ❌ NEVER add a mutation without calling `requireSession` or `requireAdmin` at the top of the handler.
- ❌ NEVER accept `userId` or `username` as an argument for authorization — always derive identity from the verified session.
- ✅ Always add `sessionToken: v.string()` to the `args` of every mutation.

---

### Convex Function Visibility

| Function type | Rule |
|---|---|
| `query` | Can be public (read-only, non-sensitive for internal tool) |
| `mutation` | MUST call `requireSession` or `requireAdmin` |
| `internalMutation` | Only callable server-side — no client auth needed |
| `internalAction` | Only callable server-side — no client auth needed |

---

### Input Validation

- All Convex functions MUST declare full arg validators using `v.*` from `convex/values`.
- ❌ Never use `v.any()` or skip validators — Convex will reject malformed input at the framework level.
- Batch mutations (e.g. `importBatch`) MUST enforce a max array size to prevent abuse.

---

### Passcode Storage

- PINs are **never stored in plain text**.
- SHA-256 hash is computed server-side in the Convex runtime using `crypto.subtle.digest`.
- The `passcode` field is **never returned** in any query response.

---

### What Is NOT Yet in Place (Future Phases)

For Phase 3 (mobile client-facing app), these MUST be added:

- Replace the custom session system with a proper **JWT auth provider** (e.g. Clerk or Auth0) using `convex/auth.config.ts` and `ctx.auth.getUserIdentity()`.
- Add **row-level security** so clients can only read their own pet/appointment data.
- Enable **HTTPS-only** and review Convex deployment environment variables.

---

### Quick Checklist Before Merging Any PR

- [ ] Every new mutation calls `requireSession` or `requireAdmin`
- [ ] Every new mutation has full arg validators
- [ ] No `userId` or user identity passed as an arg for authorization
- [ ] No secrets or tokens committed to the repo (use `.env.local` or Convex env vars)
- [ ] No `passcode` or `sessionToken` values returned in query results