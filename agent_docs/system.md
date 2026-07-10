# System — Components & Usage

The **what / when / when not** for every QickReed UI primitive. Tokens live in
[`design.md`](./design.md). Two layers:

- **neobrutal-ui primitives** (CLI-copied, owned source): `src/components/ui/{button,card,input,textarea,label,checkbox,badge,alert,dialog}.tsx`
- **hand-rolled primitives** (token-driven): `src/components/ui/{select,radio,spinner,table,join,divider,form-control}.tsx`

**Prefer the shared wrappers** in `src/components/` (`Button`, `Card`,
`ScrollLockTextArea`, `QuizQuestion`, `DeleteTextModal`, `Sidebar`, `Timer`, `RsvpDisplay`,
`RichTextEditor`) — they delegate to the primitives and keep call-site APIs stable. Icons:
Heroicons. **Never rebuild a component that already exists** — reuse the wrapper or primitive.

## Button

```tsx
<Button variant="primary" size="md">Save</Button>      {/* yellow fill, default CTA */}
<Button variant="secondary">Cancel</Button>           {/* white fill */}
<Button variant="outline" size="sm">Details</Button>   {/* transparent */}
```

- Wrapper API: `variant: "primary" | "secondary" | "outline"` (defaults `primary`),
  `size: "sm" | "md" | "lg"` (defaults `md`), `asChild`.
- Maps to primitive `default` (yellow `--main`) / `neutral` (white) / `outline`
  (transparent). All variants (incl. outline) carry `shadow-brutal` + physical hover/active.
- **When**: CTAs, form submits, nav actions. **When not**: decorative non-interactive text
  (use a styled `<span>` / `<Link>` without Button). Don't invent new variants; if you need
  one, add it to `buttonVariants` CVA in `src/components/ui/button.tsx`.
- Tap targets: every size is ≥44px (`h-11` / icon `h-11 w-11`).

## Card

```tsx
<Card shadow="md" padding="md">…</Card>   {/* shadow: sm|md|lg → shadow-brutal-sm|-|-lg */}
```

- Wrapper API: `shadow: "sm" | "md" | "lg"` (defaults `lg`), `padding: "sm" | "md" | "lg"`
  (`p-4`/`p-6`/`p-8`, defaults `md`).
- Renders 3px black border, square corners, hard offset shadow, white fill. Composes with
  `CardHeader` / `CardTitle` / `CardContent` / `CardFooter` (from the primitive).
- **When**: grouping related content, forms, result panels, reading surfaces.
  **When not**: a bare full-width page section with no border need (use a plain `<div>`).

## Input / Textarea / Select

```tsx
<Input className="w-full" />
<Textarea className="w-full" />
<Select>…</Select>   {/* native <select>, 3px border + shadow-brutal-sm + focus-brutal */}
```

3px black border, square corners, white flat fill, black text, `focus-brutal` outline.
**When not**: don't pair with DaisyUI `input-bordered`/`select-bordered`; the primitive
already styles these.

## Label / FormControl

```tsx
<FormControl>
  <Label htmlFor="email">Email</Label>
  <Input id="email" required />
</FormControl>
```

`FormControl` = `flex flex-col gap-2`. `Label` passes `htmlFor` through. **Every input must
have an associated `<Label htmlFor>`** and `required` where applicable (accessibility).

## Alert

```tsx
<Alert variant="error">Mensagem de erro em pt-BR</Alert>
<Alert variant="success">Operação concluída</Alert>
```

- `error` — `--error` red fill + black text + 3px border + hard shadow.
- `success` — white fill, check icon, pt-BR text, thick black border (**no green**).
- **When**: ActionResult / Server Action feedback. Render pt-BR `ActionError.message` here
  with no behavioral regression.

## Badge

```tsx
<Badge>active</Badge>   {/* 3px border, square, flat fill */}
```

**When**: small status/label tags. **When not**: primary navigation or large emphasis
(use Button/heading).

## Checkbox / Radio

```tsx
<Checkbox id="terms" />          {/* neobrutal-ui Checkbox (Base UI) */}
<Radio id="opt1" name="quiz" />  {/* native, appearance-none, checked:bg-black */}
```

`Radio` is hand-rolled (single usage in `QuizQuestion.tsx`). Always pair with a `<Label
htmlFor>`.

## Spinner

```tsx
<Spinner size="md" />   {/* border-[3px] border-black border-r-transparent animate-spin, aria-hidden */}
```

**When**: async loading states. Mark decorative with `aria-hidden`.

## Table

```tsx
<Table><TableHeader>…</TableHeader><TableBody>…</TableBody></Table>
```

`border-collapse`, 3px black cell borders, square. **When**: admin text lists, data
tables. Keep tap targets ≥44px in dense rows.

## Dialog

```tsx
<Dialog>…</Dialog>   {/* neobrutal-ui Dialog: square, 3px border, hard shadow */}
```

**When**: confirmations (`DeleteTextModal`), modals. **When not**: inline disclosure (use
a bordered `<Card>` or `<details>`).

## Join / Divider

```tsx
<Join><Button>Prev</Button><Button>Next</Button></Join>
<Divider>or</Divider>
```

`Join` shares inner borders (`-ml-[3px]` on inner items). `Divider` = 3px black rule,
optional label. **When**: button groups, visual separators between actions.

## Interactive states (physics)

- **Focus** — `focus-brutal` (3px solid black `focus-visible` outline, 2px offset) on every
  interactive element; never rely on color alone.
- **Hover** — element shifts toward the shadow (or shadow shrinks to `-sm`).
- **Active** — shadow offset collapses to `0 0 0 #000` and the element `translate-x/y` by the
  original offset.
- **Motion** — `transition-brutal` (`transform, box-shadow`, 150ms).

## Adding a component

Add via `npx neobrutal add <name>` (primitive in `src/components/ui/`) or hand-roll a
token-driven primitive, then expose a wrapper in `src/components/` when reused across
pages. Every new component must follow the token system and accessibility rules in
[`design.md`](./design.md).