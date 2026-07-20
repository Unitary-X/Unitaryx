# UnitaryX.org — Frontend Rebuild Brief

> **Read this first.** This file is the single source of truth for the UnitaryX rebuild.
> Every decision here was made deliberately with the owner — do not silently override them.
> If something conflicts with what you find in the code, flag it before proceeding.

---

## 1. Project overview

| | |
|---|---|
| **Site** | https://unitaryx.org — freelance dev studio (web / software / embedded hardware) |
| **Repo** | github.com/Unitary-X/Unitaryx |
| **Goal** | Full frontend rebuild in React (public site + admin), premium light-glassmorphism design, backend-editable founders & projects |
| **Deploy** | Single deploy: Flask serves the built React bundle. Docker + Procfile. |
| **Owner context** | Solo owner, also offers academic/college projects. Site login exists for project requests + feedback. |
| **Three audiences** | (1) Public visitors — marketing site. (2) Logged-in customers — `/dashboard`, a project status/report page. (3) Admin — `/admin`. All three are in scope for the React rebuild. |

---

## 2. Current real stack (verified from repo — NOT the site's marketing copy)

The site copy advertises React/Node — the actual code is Flask + vanilla JS. Trust this table, not the landing page.

| Layer | Reality |
|---|---|
| Backend | Flask + Flask-SQLAlchemy monolith — `backend/app.py` (~4,300 lines) |
| Security | Flask-Talisman (CSP/headers), Flask-SeaSurf (CSRF), Flask-Limiter (rate limits) |
| Auth | Session-based + Google OAuth (`google-auth`) — `/login`, `/google-login` routes; `login_required` / `admin_required` decorators |
| DB | SQLite via Flask-SQLAlchemy — `backend/instance/unitaryx_v2.db` |
| Extras | fpdf (PDF generation), gunicorn, mailer system (`mailers.py`, `email_tasks.py`) |
| Frontend (live) | `frontend/templates/index.html` → loads ONLY `user_premium.css` + `user_premium.js` + `traffic_tracker.js` |
| Customer dashboard (live) | `frontend/templates/dashboard.html` (~574 lines) + `dashboard.css` — route `/dashboard`, `login_required`. Currently **dark theme** (Chart.js, cyan/green glass accents) — needs conversion to the light-glass system like everything else. |
| Admin (live) | `frontend/templates/admin.html` (~4,000 lines), `login.html` |
| CI/CD | `.github/workflows/deploy.yml` — **pushes to `main` may auto-deploy to production** |

### Dead/legacy files — DELETE these (verified unreferenced by live templates)
```
frontend/static/style.css
frontend/static/cinematic.js
frontend/static/cinematic.css
frontend/static/script.js
frontend/static/css/            (entire folder)
frontend/static/js/script.js
tmp_admin_script3.js            (repo root)
```

---

## 3. Existing backend models that matter

| Model | Location | Status |
|---|---|---|
| `Project` | `backend/app.py` ~line 583 | Fields: title, description, category, tags, price, duration, rating, icon, bg_class, featured. **Seed-only today** — populated once at startup (line ~1461), no CRUD UI. Only editing path is raw JSON DB-backup import/export via `DB_BACKUP_MODELS`. |
| `Testimonial` | ~line 610 | Working carousel on current frontend — reuse its data pattern. |
| `Founder` | — | **Does not exist. Fully new.** |
| `ProjectRequest` | ~line 541 | Customer project enquiries/leads. Rich model: status (New/In Progress/Done), priority, value, lead scoring (value/urgency/conversion/total/tier), escalation_level, follow-up timestamps, internal_notes. Powers `/dashboard`. Keep `internal_notes` and lead-scoring fields admin-only — never expose them via any customer-facing API. |
| Auth models | `User`, `UserSession`, `AdminCredentialRecord`, `PasswordResetOTP` | Working — reuse, never rebuild auth. |

The existing admin panel already covers: sessions, live-user tracking, traffic analytics + CSV export, DB backup/restore, A/B tests, approval tickets, finance entries, task assignment, and superadmin controls (create/update/delete/reset-password on other admins). Full parity is required — see phase plan.

---

## 4. Locked decisions (do not re-litigate)

1. **React rebuild covers BOTH** the public site and the entire admin dashboard.
2. **Single deploy** — Vite build output served by Flask via catch-all route; Dockerfile updated accordingly. No separate frontend hosting, no CORS.
3. **Admin scope: full feature parity** with the existing panel, built in phases.
4. **New `Founder` model** + real CRUD API — holds the **whole team (~10 people)**, not just founders/co-founders; keep the model/table name `Founder` for continuity with earlier decisions, but treat it as a general team-member record. Fields: `name`, `role` (single line — deliberately NO skill tags), `bio`, `photo_url`, `socials`, `display_order`, `active`.
5. **Real CRUD API for `Project`** (add/edit/delete/reorder/feature) replacing seed-only.
6. **Light theme with glassmorphism** — explicitly NOT dark/neon. The owner rejected dark.
7. **Scroll mechanic: pin-and-cover stacking** (see §6).
8. **Founders carousel: full-frame photos** (NOT circular avatars — owner changed this deliberately). See §7.
9. **Photo storage: local disk** under Flask static (e.g. `frontend/static/uploads/`) — see §9 for the Docker volume requirement.

---

## 5. Design system

### Palette
```css
--canvas:      #F3F6FC;   /* page background — cool blue-white */
--canvas-2:    #EAF0FA;
--ink:         #10152B;   /* primary text — near-black, never pure #000 */
--ink-soft:    #4A5170;   /* secondary text */
--ink-faint:   #8890AC;   /* captions, hints */
--cobalt:      #2F5CFF;   /* primary accent — links, active states, CTAs */
--cobalt-deep: #1B3FCC;
--brass:       #B8873E;   /* signature secondary accent — used sparingly */
--brass-soft:  #E4CB98;
--glass:       rgba(255,255,255,0.58);
--glass-strong:rgba(255,255,255,0.78);
--line:        rgba(16,21,43,0.08);
```

### Glass recipe
```css
background: var(--glass);
backdrop-filter: blur(22px) saturate(160%);
border: 1px solid rgba(255,255,255,0.85);
box-shadow: 0 8px 24px -8px rgba(31,53,147,0.20);
```

### Typography
| Role | Face | Notes |
|---|---|---|
| Display / headlines | **Bricolage Grotesque** | Bold, tight letter-spacing (-0.02em), used with restraint |
| Body | **Plus Jakarta Sans** | 400–800 weights |
| Utility / tags / labels | **JetBrains Mono** | Small sizes, uppercase eyebrows |

Gradient headline treatment (hero + founders title): `linear-gradient(100deg, cobalt 10%, cobalt-deep 55%, brass 110%)` clipped to text.

### Ambient background
Three large blurred color orbs (`#9FB4FF`, brass-soft, `#C9D6FF`), fixed position, slow 22–26s drift animation, ~0.45 opacity. Sits behind everything at `z-index:-1`.

### Anti-patterns (owner-aligned)
- No dark backgrounds, no neon glow, no cyan/purple cyberpunk accents.
- No cream/terracotta "AI default" palette.
- No decorative numbered markers unless the content is genuinely sequential.

### Voice & tone — lean professional
The owner wants more professionalism, not more playfulness. "Premium" should come from visual polish and precision, not gimmicks. Concretely:
- **No emojis in UI copy or transactional messages.** Example to fix: the contact-form success message in `backend/app.py` (`api_contact`, ~line 2153) currently reads *"Thanks {name}! 🎉 Your request has been received. 🚀 Redirecting you to your dashboard... ✨"* — replace with something measured, e.g. *"Thanks, {name}. Your request has been received — redirecting you to your dashboard."*
- **Drop hype-y exclamation-point marketing language** site-wide ("Hyper Premium," "We don't compete we lead" reads as bravado — consider replacing with a calmer, confidence-through-understatement line).
- **Reconsider the "Quantum Core Cold-Boot" loading sequence and the hidden "Easter Egg: Premium Mode" command palette** from the current live site — cute, but undercuts a professional first impression for a business evaluating a dev studio. A clean, fast, no-gimmick load is more "premium" for this audience than a sci-fi boot animation.
- Admin/dashboard microcopy (empty states, errors, confirmations) should stay plain and direct — see the writing guidance already baked into §7.5 and §8 (invitational empty states, no toast spam) — professional does not mean cold, just restrained.
- This does not roll back the rich motion system in §8 (spring physics, tilt, kinetic text) — those read as engineering craft, not playfulness. The distinction is: motion that reveals content precisely = professional; copy/gimmicks that perform excitement = not.

---

## 6. Scroll mechanic — pin-and-cover stacking

Reference: Nathan Riley's "HIGHALT scroll reveal lookbook" (Dribbble) — the *mechanic*, not the dark fashion-editorial styling.

**How it works** (pure CSS, no scroll library):
- Each section = a tall wrapper (~165vh) containing a `position: sticky; top: 0; height: 100vh` panel.
- Panels carry incrementing z-index (1→5). As you scroll, the current panel holds pinned while the next slides up and **fully covers** it.
- Panel order: **Hero → Services → Founders → Projects → Contact**.
- Each panel's inner content does a one-time staggered fade/slide reveal (IntersectionObserver adds `.in-view`) as it becomes active.
- Panels have opaque-ish glass backgrounds (`rgba(243,246,252,0.94)` + blur) so covered content doesn't bleed through.
- A soft top gradient/inner shadow on each panel sells the "sheet sliding over" depth.

**Signature moment (Services panel):** three glass cards — Web / Software / Hardware — start scattered + rotated + transparent, then fly together into a neat overlapping stack when the panel activates. This literalizes the studio's pitch: three disciplines, one delivery.

---

## 7. Founders carousel spec

**Scale note**: this now represents the full team (~10 people), not just 2 founders — the carousel/peek layout and dot-pagination already handle an arbitrary count, but with 10 entries use grouped/paged dots (e.g. dots represent groups of 3, or a scrollable dot rail) rather than 10 individual dots crowding the indicator row. Consider a "Founder"/"Team" filter or ordering so leadership appears first (`display_order` already supports this).

- **Full-frame founder photos** — portrait-oriented cards, photo fills the card; a glass gradient overlay rises from the bottom edge so name/role stay legible over any photo.
- Cobalt→brass gradient accent on card border/glow.
- **Horizontal peek layout**: active card centered and full-size; neighbors partially visible at the edges, scaled down + slightly blurred + dimmed.
- **Name** bold (display face) + **role** in caps (mono face, cobalt) — one line, no tags.
- **Transition = camera racking focus**: outgoing card scales down and blurs; incoming scales up from blur → sharp. Spring physics, not linear.
- Dot progress indicator with sliding underline; arrows + dots clickable; auto-rotate (~4s) that pauses on hover/touch.
- Data source: `GET /api/founders` (ordered by `display_order`, only `active`).
- Gradient headline above: "Meet the builders of Unitary X" style treatment.

---

## 7.5. Customer dashboard / report page spec (`/dashboard`)

The one piece of the site that isn't marketing or admin — a logged-in customer's own project status report. Preserve every feature below, rebuilt in the light-glass system (currently dark, out of step with the rest of the site).

**Data**: the customer's own `ProjectRequest` rows (matched by `user_id` or email). Never expose `internal_notes` or any `lead_score_*` / `lead_tier` / `escalation_level` field to this surface — those are admin-only.

| Section | Behavior to preserve |
|---|---|
| Greeting header | "Welcome back, {first name}" |
| KPI row | Completion % (with progress bar), Total Project Value, Average Value, count of Live Updates |
| Status summary pills | Quick counts: New / In Progress / Done / Updates |
| Request list | Search (id/service/message), filter by status, sort (newest/oldest/highest value/highest priority), "Updated Only" toggle, result count |
| Request card | Service badge, status badge (with pulse indicator if recently updated), truncated message as title, id/date/deadline meta, priority badge, value |
| Roadmap modal | Click a card → modal with status-based progress steps (this is presentational/status-derived, not a separate DB-backed milestone table — keep it simple unless the owner wants real milestone tracking added later) |
| Recent Activity | Timeline of the 5 most recent requests with status dot + date + service |
| Export CSV | Client-side export of the currently filtered/sorted request list |
| Quick Actions | Links back to public site sections (services, pricing, submit new request) |
| Empty state | Invitational, not blank: "No project requests yet" + CTA to submit one |
| Status chart | Chart.js donut: New / In Progress / Done breakdown |

This page is a good candidate for the same motion system as the rest of the site (glass-shimmer skeletons while `my_requests` loads, spring-based card entrance) — but keep information density high; this is a working tool for the customer, not a marketing moment.

---

## 7.6. SEO strategy — and a real conflict this creates with Phase 1's architecture

The owner wants SEO **very well optimized**. That's in tension with Phase 1 as currently scoped: a plain client-side-rendered (CSR) React SPA, built with Vite, served as a static bundle. Flag this before building, don't discover it after:

**The conflict**: Google's crawler does execute JavaScript and can index CSR content, but slower and less reliably than server-rendered HTML. The bigger problem is **social link previews** (WhatsApp, LinkedIn, X/Twitter, Facebook) — those crawlers generally do **not** execute JavaScript at all. If `<title>`, description, and Open Graph tags are injected client-side (e.g. via `react-helmet`), sharing `unitaryx.org` will show a blank or generic preview card. For a studio relying on word-of-mouth/social sharing, that's a real cost.

**Recommended fix — no framework migration needed**: since this is fundamentally one marketing page (not many distinct routes), don't switch to Next.js/SSR. Instead, bake full static `<head>` metadata directly into the Vite build's `index.html` template (title, meta description, canonical URL, Open Graph tags incl. `og:image`, Twitter Card tags, and `application/ld+json` structured data — `ProfessionalService` or `Organization` schema). Flask serves this exact HTML shell, so the metadata is present in the raw response before any JS runs. This solves ~90% of the SEO/social-preview problem without an architecture change.

**Also required for "very well optimized"**:
- `sitemap.xml` + `robots.txt` — allow the public site, **disallow `/admin` and `/dashboard`** (private, login-gated, must not be indexed).
- Single `<h1>` per page, semantic heading hierarchy through the stacked sections, descriptive `alt` text on every founder/project photo.
- Core Web Vitals as a ranking factor, not just a UX nice-to-have — ties directly into the existing "60fps mid-range Android" quality floor in §8; the glass blur, custom cursor, and tilt effects must not tank LCP/INP on mobile.
- Make sure founders/projects content isn't the *only* copy on the page behind a slow API call with no fallback — crawlers with short render budgets may give up before data arrives. Server-render a sensible initial payload or fast-resolving fetch, not a blank shell waiting on client JS.

**Open question this raises** — worth deciding before Phase 1: do you want individual shareable project case-study pages (own URL, own meta/OG tags, e.g. `/projects/ai-water-management`) for a much bigger indexable footprint, or keep everything on the single scrolling page as currently scoped (simpler, but a smaller SEO surface)? This changes Phase 1 routing scope materially.

---

## 8. Motion & interaction system (the "premium" layer)

| Effect | Detail |
|---|---|
| Spring physics | Framer Motion springs everywhere — slight overshoot on settle. Never linear/ease-out defaults. |
| Custom cursor | Soft blurred dot → expands to translucent ring over interactive elements → "view" pill over project cards. Desktop only. |
| Magnetic CTAs | Primary buttons pull a few px toward cursor within proximity radius, spring back on leave. |
| Card tilt | Project cards: max ~6° 3D tilt following pointer + soft light-sweep across the glass. |
| Kinetic hero text | Headline reveals via staggered clip-path mask wipe per word — not a plain fade. |
| Scroll rail | Thin vertical dot-rail (left edge, desktop only) marking active stacked panel, fills as you progress. |
| Admin micro-UX | Drag-to-reorder (founders + projects), inline autosave with subtle checkmark (no toast spam), image upload with instant crop/preview, glass-shimmer skeletons, invitational empty states ("No projects yet — add your first build"). |

### Quality floor (non-negotiable)
- 60fps on mid-range Android → animate **transform/opacity only**, GPU-accelerated.
- `prefers-reduced-motion: reduce` fully honored — all animation collapses to static, sticky stack degrades to normal flow.
- Full keyboard navigation + visible focus states on every interactive element.
- Skeleton content while `/api/founders` and `/api/projects` load — never a blank screen.
- Responsive to small mobile; the stacked-panel heights adjust (~150vh mobile).

---

## 9. Repo-specific gotchas (will bite if ignored)

1. **CSRF — Flask-SeaSurf is active.** Every React POST/PUT/DELETE must fetch + attach the CSRF token or requests 403 silently. Build a small fetch wrapper that handles this once.
2. **CSP — Flask-Talisman enforces strict headers.** The Vite bundle (hashed JS/CSS, possibly inline chunks) must be allowed via nonce/hash config in Talisman, or the built app will be blocked by its own backend. Verify in a production-mode run, not just `vite dev`.
3. **Auto-deploy risk**: `.github/workflows/deploy.yml` may deploy `main` straight to production. Work on a feature branch; merge only after each phase is verified.
4. **Docker + local uploads**: uploaded founder/project photos land on container disk and are **lost on redeploy** unless the uploads dir is a mounted volume. Add the volume mapping to `docker-compose.yml` AND confirm it on the production host. Validate file type/size on upload; save a resized web-optimized copy.
5. **Rate limits**: new CRUD endpoints follow the same Flask-Limiter pattern as existing routes.
6. **Mailing service is live and configured — treat with care, don't rebuild it.**
   - SMTP-based (Gmail + app password by default), env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_USE_TLS`/`SMTP_USE_SSL`.
   - Optional async delivery via Celery + Redis (`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`) — falls back to synchronous send if no broker configured.
   - Bilingual templates (English/Hindi) via Jinja2, in `backend/templates/emails/`.
   - **Three live flows, all real**: (a) welcome email on signup (`backend/app.py` ~line 1746), (b) admin task-assignment notification, (c) OTP codes for password reset (`/send-otp`, `/verify-otp`, `/reset-password`).
   - **DONE (already delivered outside this brief)**: `welcome.html/.txt` and `assigned.html/.txt` were redesigned to match the brand (cobalt/brass accents, card layout, proper CTA button, email-client-safe inline CSS). A real bug was also fixed in `mailers.py` — the welcome email's button was incorrectly reusing the admin-task email's "Open the admin panel" text; it now has its own `welcome_cta` translation key ("Go to your dashboard"). If these files aren't yet in the repo, copy them in before starting Phase 1.
   - **Customer dashboard stays read-only for now** — no new "project status changed" email. Revisit later if wanted.
   - **Testing caution**: real SMTP credentials are configured. Running signup/password-reset flows during Phase 2+ testing will send real emails — use a throwaway test inbox while developing, not the production `SMTP_USER`.
7. **Two DB files exist** (`backend/instance/unitaryx_v2.db`, `backend/unitaryx_v2.db`, plus root `instance/`) — confirm which one the configured `SQLALCHEMY_DATABASE_URI` actually uses before running migrations; don't migrate the wrong file.

---

## 10. New API surface (Phase 1 target)

```
GET    /api/founders               public — ordered, active only
POST   /api/admin/founders         admin — create
PUT    /api/admin/founders/<id>    admin — update
DELETE /api/admin/founders/<id>    admin — delete
POST   /api/admin/founders/reorder admin — bulk display_order update

GET    /api/projects               exists — keep, extend with ordering
POST   /api/admin/projects         admin — create
PUT    /api/admin/projects/<id>    admin — update
DELETE /api/admin/projects/<id>    admin — delete
POST   /api/admin/projects/reorder admin — bulk display_order update

POST   /api/admin/upload           admin — image upload (type/size validated, resized copy saved)
```
All admin routes: `admin_required` + CSRF + rate limit. `Project` needs a `display_order` column added (migration).

---

## 11. Phase plan — each phase independently testable

| Phase | Scope | Done when |
|---|---|---|
| **1** | Vite+React scaffold wired into Flask (catch-all + Dockerfile). Public site: stacked scroll panels, glass design system, founders carousel (now ~10 people), projects grid. Backend: `Founder` model, CRUD APIs (§10), migration. **Plus SEO (§7.6)**: static meta/OG/JSON-LD baked into the served HTML shell, `sitemap.xml`, `robots.txt` disallowing `/admin` + `/dashboard`. | Public site renders from live DB data; admin can hit CRUD via API; sharing the URL shows a proper link preview; Lighthouse SEO score checked. |
| **2** | Customer dashboard rebuild (§7.5) in React, light-glass theme, same `/dashboard` route/auth. | Every feature in §7.5 preserved; dark theme fully replaced. |
| **3** | React admin shell (existing Google OAuth/session) + Founders & Projects CRUD screens with drag-reorder + upload/crop. | Owner can fully manage founders/projects without touching code. |
| **4** | Traffic analytics, live users, A/B tests in React. | Parity with current analytics screens. |
| **5** | Finance entries, approvals, task assignment. | Parity with current workflow screens. |
| **6** | Superadmin (admin management, password resets, session revoke) + DB backup/restore. | Old `admin.html` fully retired and deleted. |

**Testing note:** phases 4–5 touch finance and credential flows — test auth, CSRF, and superadmin paths manually before merging each phase. Never merge untested into `main` (see gotcha #3).

---

## 11.5. Future roadmap (Phase 7+ — ideas, not committed scope)

Don't build any of this during Phases 1–6 unless the owner explicitly pulls an item forward. Listed here so Claude Code doesn't architect Phase 1 in a way that blocks these later.

**Natural extensions of things already in the codebase:**
- **Testimonials on the public site** — `Testimonial` model already exists (§3) with a working carousel pattern on the old frontend, but isn't in the current rebuild scope. Reviving it as its own stacked panel (or folding into Founders) is low-effort since the data/model already exists.
- **Public A/B testing** — `ABTestConfig` model already exists (currently admin-only config). Could extend to testing actual public-site copy/layout variants, not just internal admin experiments.
- **PDF portfolio / case-study export** — `fpdf` is already a dependency (used for admin report exports). A downloadable PDF portfolio/case-study one-pager per project is a small lift given the library is already wired in.
- **Site-wide Hindi (i18n)** — the mailing service is already bilingual (en/hi templates). Extending that to the actual site UI is a natural next step if the client base has Hindi-speaking preference.

**Bigger, needs its own scoping conversation:**
- **Individual project case-study pages** — flagged in §7.6 as an open question; if deferred rather than done in Phase 1, it belongs here.
- **Client portal beyond read-only** — file uploads, deliverable approvals, in-portal messaging on `/dashboard`. Explicitly out of scope for now (§ decided: read-only), but the `ProjectRequest` model and mailing service are both already positioned to support this later.
- **Payments** — `FinanceEntry` model exists admin-side; a customer-facing "pay a milestone invoice" flow would need a real payment gateway (Razorpay/Stripe) and is a meaningfully bigger scope than anything else here — security-sensitive, needs its own brief when it comes up.
- **Blog / content marketing** for organic SEO growth beyond the single marketing page — pairs naturally with the SEO work in §7.6 if the owner wants to build search traffic over time, not just convert visitors who already found the site.
- **Newsletter signup** — SMTP/mailing infra already exists; just needs a subscribe model + opt-in flow.

---

## 12. Outstanding — owner still to provide

- [ ] Real founder/co-founder details: name, role (one line), short bio, photo (full-frame portrait works best), socials. Now need ~10 team members' worth, not 2.
- [ ] Individual shareable project pages (bigger SEO footprint, more Phase 1 scope) vs. keep everything on one scrolling page (§7.6) — decide before Phase 1 routing is built.
- [ ] Production host confirmation for the uploads volume mount (gotcha #4).
