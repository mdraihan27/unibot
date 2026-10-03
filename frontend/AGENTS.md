<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UNIBOT Project Rules

## You are a very experienced full stack web developer and also a UI/UX desginer.
## You know very well how to handle UI and UX. 
## You follow the design rules strictly. 
## Your goal is to make the website beautiful and user friendly. 


# Use tailwind CSS alwasy for design.

## 1. Design Tokens

Define all tokens in `tailwind.config` and `globals.css`. Never hardcode values in components.

### Colors

| Token | Value | Notes |
|---|---|---|
| `background` | `#E45043` | Page background |
| `foreground` | `#FFFFFF` | Default text |
| `error` | `#A82020` | Error states |
| `footer-bg` | `#BBD5DA` | Footer background |
| `brand` | `#E45043` | Footer site name |

### Buttons

| Variant | Background | Text | Hover |
|---|---|---|---|
| Glow | Semi-transparent glassmorphism | White | `cursor: pointer`, increased brightness |
| Regular | White | Black | `cursor: pointer`, increased brightness |

### Radius

- Buttons: `8px`
- Everything else: `6px`
- No heavily rounded corners anywhere.

### Typography

- Font: Montserrat (weights 100 to 900, italic supported)
- Load via `next/font/google`, not the `<link>` tags.
- Sizing in `rem`. Use `clamp()` for large headings.

## 2. Layout

### Navbar

- Fully transparent, no background.
- Items: Home, Features, Terms and Policy, Login/Signup

### Footer

- Background `#BBD5DA`
- Large site name in `#E45043` that takes almost the whole height.
- Footer height: 100px
- Site name position: left side, 
- Page links
- Copyright info
- Developer LinkedIn and GitHub links

## 3. Behavior

- **Page transition loader:** "UNIBOT" text with a glow sweeping left to right.
- **Data loading:** show a skeleton after page load, before any API fetch resolves.
- **Scroll effects:** Framer Motion.
- **Responsive:** all breakpoints.

## 4. Code Rules

- Highly component-based. Extract every reusable element into its own component.

## 5. Content Restrictions

- No dots in UI.
- No em dashes or en dashes anywhere (UI copy, code comments, docs).
- Never add badge or pill announcement chips (such as Next Generation tags).
- Never add dot points, status dots, bullet indicators, or square dot markers anywhere in the UI.