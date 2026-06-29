# Project Specs — Rubén Calderón Personal Portfolio

## What It Does
A high-fidelity personal portfolio website for Rubén Calderón (Senior AI Cloud Engineer at Oracle). Single-page scrollable site showcasing career experience, projects, certifications and skills. All content is public — no authentication.

## Who Uses It
Recruiters, hiring managers, and technical collaborators visiting to learn about Rubén's background and contact him.

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + CSS custom properties (design tokens)
- **Animations:** Framer Motion (scroll reveals, hover effects)
- **Fonts:** Inter (Google Fonts) — SF Pro resolves natively on Apple platforms
- **Deployment:** Vercel

## Pages & Sections (single-page, scroll-based)
1. **Left icon rail** — fixed, 72 px wide, z-index 50, scroll-spy highlights active section
2. **Hero** — video background (Alumica), 40 % black overlay, typewriter headline, social links, CTA buttons
3. **Platforms Strip** — logos: Oracle, SAP, Google Cloud, Kubernetes, Terraform, Azure
4. **Core Competencies** — sticky left column + 4-item right list (AI Ops, Agentic RAG, IaC, Observability)
5. **Career Timeline** — 4 roles with dates and bullet points
6. **Featured Projects** — 2×2 card grid with placeholder images
7. **Certifications** — 3-column grid of 7 credential cards with Credly links
8. **Skills / Toolbox** — 2-column grid of 6 tagged skill groups
9. **Contact + Footer** — CTA buttons, email, phone, language info, copyright

## Animation Features
- **Hero video background:** `https://cdn.sceneai.art/Hero%20Section%20Video/5a6cf9a9-9f93-4e44-88f3-cf666065daf7.mp4` (autoplay, muted, loop) + 40 % black overlay
- **Typewriter animation on "Rubén Calderón."** — character-by-character, ~80 ms/char with natural ±20 ms variance, vertical blinking cursor (1 s step-end cycle) attached to text end
- **Scroll reveals:** Framer Motion `whileInView` fade-up (translateY 20 px → 0, 0.8 s cubic-bezier) on every section block
- **Hover effects:** card lift (-4 px translateY), nav icon color shift, button press scale (0.95)
- **Available badge:** pulsing green dot

## Design Tokens (from design-tokens.css)
- Primary: `#0066cc` / Focus: `#0071e3` / On-dark links: `#2997ff`
- Ink: `#1d1d1f` / Muted: `#86868b` / `#6e6e73`
- Dark tile: `#272729` / Canvas: `#ffffff` / Parchment: `#f5f5f7`
- Font weights: 300, 400, 600, 700 **only**
- Single shadow: `3px 5px 30px 0 rgba(0,0,0,0.22)` — competency image only

## Rules (from design handoff)
- No opacity `fill-mode: both` — entrance animation is transform-only
- No emoji
- Pill CTAs: only `scale(0.95)` on press, no color change on hover
- Image placeholders with correct `id` attributes (rc-headshot, rc-competency, rc-proj-1…4)
- Scroll nav uses `window.scrollTo`, never `scrollIntoView`

## "Done" Looks Like
- All 9 sections render with correct content from the design file
- Video background plays in the hero (muted, looped)
- Typewriter animation types "Rubén Calderón." on page load with blinking cursor
- Left icon rail highlights active section on scroll
- `npm run build` passes with 0 TypeScript errors
- Dev server runs without console errors
