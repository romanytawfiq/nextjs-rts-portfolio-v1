# AGENT.md — Romany Tawfiq Shehata Developer Portfolio

> **Project status:** Implementation complete locally; production release is blocked on owner/host verification.
> **Implementation status:** Frontend, backend, SQLite CMS, authentication and CI are implemented and verified with `npm run verify`. See `docs/PRODUCTION_CHECKLIST.md` for the remaining owner blockers.

## 1. Project mission

Plan and build a professional, bilingual personal developer portfolio for **Romany Tawfiq Shehata**, supported by a private admin dashboard (a small CMS) that allows the owner to manage the public portfolio without editing source code.

The public website must present the owner's professional profile, technical skills, selected projects, certifications, contact channels, social links, and public GitHub repositories. It must help recruiters and hiring teams quickly understand the owner's capabilities and inspect real work.

The project is not merely a static landing page. The admin dashboard, content model, authentication, GitHub integration, localization, accessibility, SEO, security, and production deployment are first-class requirements.

## 2. Current SDLC phase and working rules

The project is currently in **Planning**. Work in this phase may include:

- Requirements discovery and clarification.
- Review and normalization of the supplied CV and other owner-provided assets.
- Product requirements, user stories, acceptance criteria, and scope definition.
- Information architecture, sitemap, user flows, and wireframes.
- UI/UX direction and bilingual design-system planning.
- System architecture, database design, integration contracts, security model, and Architecture Decision Records (ADRs).
- Testing strategy, deployment strategy, risks, and implementation backlog.

Do not write application code during this phase. Do not scaffold the Next.js project, create components, write SQL or migrations, install packages, or make deployment changes unless the owner explicitly authorizes implementation.

When information is missing, do not invent personal details, credentials, links, work history, education, or achievements. Record the item as **Pending owner input** and continue with the rest of the plan. Distinguish confirmed facts, recommendations, assumptions, and unresolved decisions.

Do not silently change the agreed stack. Any proposed addition or replacement must be explained and recorded as a decision for owner approval.

## 3. Owner profile — source of truth

Use the supplied CV as the initial source of truth. Preserve the spelling and meaning of the source information. The following details were present in the CV:

### Identity and professional positioning

- **Name:** Romany Tawfiq Shehata
- **Current CV title:** Junior Front-End Developer
- **Location:** Nag Hammadi, Qena, Egypt
- **Professional summary:** Motivated Junior Front-End Developer with hands-on experience building personal web projects using modern web technologies. Knowledgeable in JavaScript, React.js, Next.js, TypeScript, and responsive UI development with HTML, CSS, and Tailwind CSS. Also familiar with backend development, RESTful APIs, and relational and NoSQL databases. Eager to contribute to a development team, solve practical problems, and continue developing strong front-end engineering skills.

### Contact and public profiles

- **Phone:** 01201777051
- **WhatsApp:** 01006985069
- **Current portfolio URL in CV:** https://romanytawfiq-portfolio.vercel.app
- **GitHub:** https://github.com/romanytawfiq
- **LinkedIn:** https://linkedin.com/in/romany-t-shehata-832639386

The CV does not list an email address. The owner supplied and explicitly approved `romanytawfiqshehata@gmail.com` for publication on 2026-11-26; it is seeded as a contact method and social link and rendered in both locales.

### Technical skills from the CV

- **Frontend fundamentals:** HTML5, semantic markup, CSS3, responsive layouts, Flexbox, CSS Grid, Tailwind CSS.
- **Programming languages:** JavaScript (ES6+), modern JavaScript syntax, browser-side interactivity, asynchronous programming fundamentals, TypeScript.
- **Frontend frameworks and routing:** React.js, components, props, state, hooks, reusable UI, Next.js fundamentals, React Router DOM.
- **State management:** Redux, Redux Toolkit, Zustand.
- **Forms and validation:** React Hook Form, Zod.
- **Backend development:** Node.js, Express.js, RESTful API fundamentals, connecting frontend applications to backend services.
- **Databases:** MongoDB, MySQL, relational and NoSQL database fundamentals.
- **Tools and workflow:** Git, GitHub, Claude, ChatGPT.
- **Additional knowledge:** Computer networking fundamentals, Linux system basics, filesystem navigation, command-line fundamentals.

Do not upgrade a skill level or describe a technology as professional-level unless the owner confirms that wording.

### Projects named in the CV

1. **SendFlow — SMS Messaging Platform**
   - CV description: A web platform designed to help businesses send, receive, and manage SMS communications.
   - CV-listed stack: Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, authentication, and email integration.
   - The CV labels a GitHub Repository and Live Demo, but does not include their actual URLs. Treat those URLs as pending owner input or verify them through the owner's authorized GitHub connection; never guess them.

2. **E-Commerce RESTful API**
   - CV description: An e-commerce backend API built using Node.js, Express 5, TypeScript, and MongoDB.
   - CV-listed features: JWT authentication, role-based access, product and category management, reviews, wishlists, addresses, coupons, image processing, search, sorting, and pagination.
   - The CV labels a GitHub Repository but does not include its actual URL. Treat the URL as pending owner input or verify it through the owner's authorized GitHub connection; never guess it.

### Certification and languages

- **Certification:** Meta Front-End Developer Professional Certificate — Coursera.
- **CV-listed coverage:** Front-end development foundations, HTML, CSS, JavaScript, React, responsive web design, version control, and building interactive user interfaces.
- **Resolved 2026-11-26:** the owner supplied `certificaties/` with 15 certificate PDFs. All 15 are seeded in SQLite with titles, issuers, issue dates and issuer verification links printed on the certificates where available, and published as downloadable PDFs under `public/certificates/`. These are 9 Meta/Coursera courses, the Meta professional certificate, 2 Udemy certificates and 3 Shiyar Academy certificates. Certificate details remain English-only until the owner supplies reviewed Arabic copy.
- **Arabic:** Native.
- **English:** Intermediate.

The CV does not provide education history or employment history. Do not invent either. The portfolio may omit those sections until the owner provides verified information.

## 4. Required technology stack

The owner has specified the following technologies as the baseline stack:

- **Next.js**
- **next-intl** (owner-approved addition, ADR-002)
- **OAuth**
- **SQLite**
- **Tailwind CSS**
- **Axios**
- **Framer Motion**
- **Zustand**
- **React Hook Form**
- **Zod**

Plan around this stack. The exact versions, authentication library, SQLite hosting model, database access layer/ORM, and asset-storage provider are not yet approved and must be selected during architecture planning.

### Stack usage principles

- Prefer the **Next.js App Router** unless an approved ADR documents a reason not to.
- Prefer React Server Components for content-first pages and server-side data access. Use Client Components only for interactive features that require browser state or event handlers; do not turn entire pages into Client Components without a documented reason.
- Use next-intl for all UI copy and explicit `/en` / `/ar` routing; keep CMS-authored content in SQLite. See ADR-002.
- Use Tailwind CSS for responsive styling and the shared design system.
- Use Framer Motion for restrained, purposeful transitions. Respect `prefers-reduced-motion`; animation must never block access to content or controls.
- Use Zustand for genuinely shared client-side UI state (for example, dashboard UI state or client preferences where appropriate). Do not use it as the source of truth for authentication, authorization, or persisted CMS data.
- Use React Hook Form with Zod for interactive forms. Validate all untrusted input again on the server with Zod or equivalent server-side validation; client validation is not a security boundary.
- Use Axios for planned HTTP integrations such as GitHub API requests where appropriate. Centralize configuration, timeouts, error handling, and caching behavior. Do not expose secrets or privileged tokens to browser code.
- SQLite is the required relational data model unless the owner approves a change. The deployment architecture must provide durable storage and safe concurrent access; a local SQLite file inside an ephemeral serverless function is not an acceptable production persistence strategy.

## 5. Product scope

### 5.1 Public portfolio

Plan the following public-facing capabilities:

- Professional hero section with name, professional title, short introduction, primary call to action, and clear contact or resume actions.
- About/profile section.
- Technical skills grouped by meaningful categories.
- Featured projects with detailed project pages or expandable detail views.
- A GitHub repositories section showing the owner's public repositories, with clear links to the original repositories.
- Certifications section with issuer, credential information, issue date when provided, and credential link when verified.
- Contact section with owner-approved contact methods and social profiles.
- Optional CV download, only after the owner approves the file and its public availability.
- Clear navigation, language switcher, and theme control.

The public page should prioritize recruiter usability: clear hierarchy, readable project descriptions, visible technology stacks, meaningful repository/live-demo links, and concise calls to action. Avoid decorative elements that make the site look like a generic template or reduce readability.

### 5.2 Admin dashboard

The dashboard is private and must allow the owner to manage portfolio content without code changes. Plan the following modules:

1. **Dashboard overview:** content summary, GitHub sync status, and quick links to common actions.
2. **Profile management:** name display, job titles, localized summaries, location, profile image, and optional resume file/URL.
3. **Contact management:** phone, WhatsApp, optional email, preferred contact action, visibility, and display order.
4. **Social links:** add, edit, remove, enable/disable, and reorder links.
5. **Skills management:** create categories; add, edit, reorder, and hide skills; optionally store a level only when the owner supplies an accurate level.
6. **Projects management:** create, edit, preview, publish/unpublish, feature/unfeature, reorder, and remove project entries; manage descriptions in both languages, technologies, screenshots, repository URL, live demo URL, and other project links.
7. **Certifications management:** create, edit, reorder, publish/unpublish, and manage issuer, descriptions, dates, credential URLs, and certificate images/files when supported by the approved storage design.
8. **GitHub integration:** connect/check the owner's GitHub identity, trigger sync, display last successful sync and errors, and manage repository visibility/featured status/order without losing source repository data.
9. **Localization management:** bilingual UI routing remains; a dedicated admin localization editing/coverage page and UI pending notices are out of scope by owner decision (2026-11-26). Missing copy is tracked in planning docs, not shown as alerts. Do not machine-translate or invent Arabic CMS copy.
10. **Site settings:** default language, theme behavior, SEO metadata, and public section visibility.
11. **Preview:** preview public content in Arabic/English and light/dark themes before publishing.

A save operation must provide clear success/error feedback. Destructive operations should require confirmation. Forms must preserve entered values after validation errors and provide accessible field-level messages.

## 6. Bilingual and theme requirements

### Arabic and English

- The entire public experience must support Arabic and English, not only selected text blocks.
- The admin dashboard must also be bilingual.
- Arabic pages must use right-to-left direction (`rtl`) and English pages left-to-right direction (`ltr`). Direction must be applied at the document/layout level and respected by components, spacing, navigation, forms, tables, icons, and motion—not simulated only with text alignment.
- All owner-editable content that appears publicly must have Arabic and English values or an explicit, approved fallback policy.
- Do not machine-translate or invent Arabic profile copy without owner review. Do not surface owner-review notices in the UI; record missing copy in planning docs only.
- Locale-aware metadata, date/number formatting, document language, and accessibility labels must be considered.
- Use explicit locale routes (recommended shape: `/en` and `/ar`) unless an ADR approves another routing design.
- **Default locale is pending owner approval.** English-first is a reasonable recommendation for international recruiter visibility, while Arabic must remain one click away.

### Light and dark themes

- Provide both light and dark themes.
- Plan a theme toggle that is visible and keyboard accessible.
- Avoid a flash of the wrong theme during initial rendering.
- Persist the visitor's preference where appropriate and define how system preference is used.
- Verify color contrast, focus indicators, disabled states, forms, charts (if any), and image treatments in both themes.

## 7. GitHub integration requirements

The GitHub integration has two distinct responsibilities. Do not conflate them:

### A. GitHub OAuth for dashboard access

- GitHub OAuth is the proposed sign-in method for the owner/admin dashboard.
- Only the owner's verified GitHub identity may access administrative features.
- Do not allow every user who can sign in with GitHub to become an administrator.
- Use a stable GitHub numeric account ID for the admin allowlist after the owner confirms the identity; a username alone can change.
- Use the authorization-code flow with `state` protection and PKCE (`S256`) where supported by the chosen implementation.
- Request the minimum OAuth scopes needed for the approved features. Do not request private repository access (`repo`) merely to list public repositories.
- Keep OAuth client secrets and access tokens server-side. Never put them in `NEXT_PUBLIC_*` environment variables or browser bundles.
- Create secure sessions using an established, maintained authentication/session library selected in an ADR. Protect every dashboard page, route handler, server action, and data mutation with server-side authorization checks.
- Provide logout and a safe way to revoke or disconnect the integration.

### B. GitHub API for public repository display

- The initial account to integrate is `romanytawfiq` (`https://github.com/romanytawfiq`).
- Fetch the owner's **public** repositories from the GitHub API on the server.
- Display repository name, description when available, primary language when available, topics when available, repository URL, and other useful public metadata supported by the API.
- Include pagination and handle repositories beyond a single API response page.
- Default behavior should include all public repositories unless the owner explicitly configures filters. Do not silently exclude archived repositories or forks; make any filtering policy configurable and visible in the admin dashboard.
- Let the owner mark repositories as featured, change their display order, and hide selected repositories from the public page without deleting them from GitHub.
- Manually curated project entries and automatically synchronized repositories are separate concepts. A featured project may reference a GitHub repository, but syncing must not overwrite owner-written Arabic/English descriptions, screenshots, or custom display settings.
- Cache API results on the server, define an explicit refresh strategy, and show the last successful sync time and sync errors in the dashboard.
- Handle rate limits, pagination, unavailable repositories, network failures, renamed repositories, deleted repositories, and stale cached data gracefully.
- Public repository listing must work without exposing a privileged token. Use authenticated API access only when a clearly approved feature requires it.
- Do not promise that private repositories will appear publicly. Private repository access is out of initial scope and requires a separate explicit owner decision and narrower security review.

## 8. Suggested information architecture

This is a planning baseline, not a final visual design. Validate it through wireframes and owner review.

### Public routes

- `/en` — English portfolio home.
- `/ar` — Arabic portfolio home.
- `/en/projects/[slug]` and `/ar/projects/[slug]` — localized project details, if separate detail pages are approved.
- Optional localized privacy or attribution pages only if needed.

### Admin routes

- `/admin/login`
- `/admin`
- `/admin/profile`
- `/admin/skills`
- `/admin/projects`
- `/admin/certifications`
- `/admin/contact`
- `/admin/social-links`
- `/admin/github`
- `/admin/settings`

Keep admin pages out of search indexing. The exact route structure and whether admin routes are localized are design decisions to finalize during planning.

## 9. Initial data model — planning proposal

Design a relational SQLite schema with migrations and clear ownership of data. The following entities are a starting point; normalize or combine them only when supported by the requirements and an approved database design:

- **Admin identity / allowlist:** stable GitHub user ID, username snapshot, enabled status, and audit metadata.
- **Profile:** owner identity, localized professional title and summary, location, optional profile image, optional resume reference.
- **Contact method:** type, value, label, visibility, preferred status, and sort order.
- **Social link:** platform, URL, custom label, visibility, and sort order.
- **Skill category:** localized title, description if required, visibility, and sort order.
- **Skill:** category relation, name, optional owner-approved level, visibility, and sort order.
- **Project:** stable slug, localized title and descriptions, technologies, repository/live-demo URLs, images, featured flag, publication status, and sort order.
- **Certification:** localized title/description, issuer, issue date, credential URL, optional media reference, visibility, and sort order.
- **GitHub repository cache:** GitHub repository ID, owner/name, source metadata, last sync time, and owner-managed presentation settings such as hidden/featured/order.
- **Site settings:** default locale, theme defaults, SEO metadata, and section visibility.
- **Audit events:** security-relevant admin actions where proportionate and useful.

Define unique constraints, foreign keys, indexes, deletion behavior, migration strategy, backup/restore strategy, and seed behavior during database design. Never seed invented personal facts.

## 10. Security, privacy, and content integrity

- Treat the admin dashboard as a privileged system, even though it is a single-owner portfolio.
- Enforce authorization on the server for every protected operation. Hiding admin controls in the UI is not authorization.
- Follow the chosen auth library's current security guidance. Use secure, HttpOnly, SameSite cookies and production HTTPS settings for sessions.
- Protect OAuth callback and state-changing requests against CSRF and validate callback origins/redirects.
- Validate and normalize URLs before rendering links. Use safe external-link behavior and avoid rendering untrusted HTML.
- Validate uploaded file type, size, and content; do not trust a filename or browser MIME type. Select an approved storage provider before planning uploads.
- Keep secrets in environment variables managed by the host. Provide an `.env.example` only during the implementation phase and never commit real secrets.
- Add reasonable rate limits to login/callback-sensitive and public mutation endpoints where relevant.
- Do not expose personal contact information unless the owner chooses to publish it. Provide per-field visibility controls.
- Include backup and recovery planning for the SQLite database and uploaded assets.

## 11. Accessibility, SEO, and performance

### Accessibility

- Use semantic HTML and a logical heading hierarchy.
- Ensure keyboard navigation, visible focus, accessible labels, useful error messages, and sufficient contrast.
- Verify layout and reading order in both RTL and LTR.
- Respect reduced-motion preferences.
- Do not encode information using color alone.

### SEO and recruiter usability

- Generate localized page titles, descriptions, canonical URLs, and `hreflang` alternates.
- Provide Open Graph metadata and social sharing previews.
- Include sitemap and robots directives; prevent admin pages from indexing.
- Make project descriptions, skills, and contact information available in crawlable server-rendered HTML where appropriate.
- Use clear page titles and descriptive links. Do not use vague labels such as "click here" for important project actions.
- Use structured data for a Person/Portfolio only when the information is verified and the schema is appropriate.

### Performance

- Prefer server rendering for public content and keep client-side JavaScript limited to real interactions.
- Optimize images and avoid unnecessarily large animation bundles.
- Cache GitHub data and avoid one GitHub request per visitor.
- Define loading, empty, error, and stale-data states for all integrations.
- Establish measurable targets for Core Web Vitals and test on mobile, desktop, and slower connections.

## 12. Deployment and SQLite decision gate

SQLite is approved as the database technology, but the production storage topology is **not yet approved**.

- If deployment is on Vercel, do not use a local SQLite database file in a Vercel Function as durable production storage. Vercel Functions have a read-only filesystem with writable temporary scratch space; separate function instances do not provide a shared durable database file.
- For a Vercel deployment while retaining SQLite compatibility, evaluate a managed SQLite-compatible service such as Turso/libSQL and verify its current driver, connection, region, backup, and pricing characteristics before selecting it.
- If using a traditional Node.js host with a persistent disk, local SQLite may be viable, subject to backup, concurrency, file-permission, and deployment safeguards.
- The current CV lists a Vercel-hosted portfolio URL. Treat Vercel as a **working assumption only**, not a final hosting decision.
- Do not choose a production ORM or database adapter until the hosting model is known. Record the selected option in an ADR.

Deployment planning must cover development/staging/production environments, environment variables, OAuth callback URLs, database migrations, backups, restore testing, logging, error monitoring, domain/HTTPS, and rollback.

## 13. Quality and acceptance criteria

Before release, the project must satisfy all of the following:

- Public pages render correctly in Arabic RTL and English LTR.
- Light and dark themes work without unreadable content or an initial theme flash.
- The owner can securely sign in through the approved GitHub OAuth flow.
- A non-allowlisted GitHub account cannot access the admin dashboard or protected operations.
- The owner can create, edit, reorder, publish, hide, and delete supported content types.
- The owner can preview changes in both languages before publishing.
- Missing translations are identifiable and follow an owner-approved fallback policy.
- Public GitHub repositories are synchronized with pagination, caching, rate-limit handling, and a visible last-sync status.
- Manual project content and repository metadata do not overwrite each other unexpectedly.
- Invalid form data is rejected on the server and reported clearly in the UI.
- Protected routes and mutations are authorized on the server.
- SEO metadata and indexability rules are correct for public and admin pages.
- No personal contact detail, certificate URL, project link, or work-history claim is fabricated.
- Production persistence, backup, and restore behavior are verified on the chosen host.
- Automated tests cover critical business logic, authorization, GitHub synchronization, localization direction, forms, and major public/admin flows.
- A final production smoke test confirms that the deployed site and admin flows work as expected.

## 14. Required planning deliverables before implementation

Produce and review these artifacts with the owner before coding:

1. **PRD:** goals, target audience, scope, exclusions, user stories, and acceptance criteria.
2. **Content inventory:** every CV-derived fact and all missing assets/URLs requiring owner confirmation.
3. **Sitemap and user flows:** public browsing, language switching, admin login, content editing, publishing, and GitHub sync.
4. **Wireframes:** public homepage, project details, admin overview, and all major editing screens.
5. **Design system proposal:** typography, colors, spacing, responsive breakpoints, RTL/LTR rules, theme tokens, and motion principles.
6. **Architecture document:** Next.js boundaries, server/client responsibilities, auth flow, GitHub integration, caching, and error handling.
7. **ERD and data dictionary:** SQLite tables, relations, constraints, indexes, and migration approach.
8. **Security plan:** identity allowlist, OAuth scopes, session strategy, authorization points, secrets, and data protection.
9. **Deployment ADR:** hosting choice, SQLite-compatible production storage, asset storage, backups, and cost considerations.
10. **Testing plan:** unit, integration, end-to-end, accessibility, SEO, performance, and production smoke tests.
11. **Prioritized implementation backlog:** milestones, dependencies, risks, and definition of done.

Implementation begins only after the owner has reviewed and approved the planning deliverables and explicitly authorizes the next SDLC phase.

## 15. Open decisions and pending owner input

Track these items explicitly; do not silently resolve them:

1. **Existing project file:** The original `AGENT.md` was not included with the supplied CV. This document is a new baseline specification, not a merge with an unseen file.
2. **Hosting:** Confirm whether the new site will be deployed to Vercel or another host. The CV's current Vercel URL is not proof of the new deployment choice.
3. **SQLite production option:** If Vercel is chosen, approve or reject Turso/libSQL after a current technical and cost review.
4. **Default locale:** Confirm English-first or Arabic-first behavior. Both locales are mandatory either way.
5. **GitHub identity:** Confirm the GitHub account is `romanytawfiq` and capture its stable numeric GitHub user ID before enabling admin access.
6. **Repository visibility:** Initial scope is public repositories only. Confirm whether any further private-repository use case is required; do not request private repository scopes without explicit approval.
7. **Project URLs:** Supply or approve the actual SendFlow and E-Commerce API repository/live-demo URLs if they cannot be verified through the authorized GitHub integration.
8. **Certificate URL:** Supply the Meta certificate credential URL and any additional certificate details/images.
9. **Email:** Resolved on 2026-11-26 — the owner approved publishing `romanytawfiqshehata@gmail.com` on the public site.
10. **Profile image and CV download:** Resolved on 2026-11-26 — the owner supplied `public/rts.jpeg` and `public/rts_cv.pdf` and asked to publish them; both are linked from the public hero.
11. **Asset storage:** Decide whether project screenshots and certificate images will use a managed object-storage provider or approved external URLs.
12. **Authentication library and database access layer:** Auth.js / NextAuth v5 beta is implemented for sign-in and JWT sessions and was approved by the owner on 2026-11-26 (ADR-004). Database access remains built-in `node:sqlite` with no ORM (ADR-001).
13. **Education and work experience:** The CV supplied for planning does not list these sections. Add them only if the owner supplies verified details.

## 16. Documentation and research references

Use current official documentation during implementation planning and re-check it before implementation because framework and provider behavior can change:

- Next.js App Router: https://nextjs.org/docs/app
- Next.js Authentication guide: https://nextjs.org/docs/app/guides/authentication
- GitHub OAuth authorization flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub REST API repositories: https://docs.github.com/en/rest/repos/repos
- GitHub REST API rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- Vercel Functions runtimes and filesystem: https://vercel.com/docs/functions/runtimes
- Vercel storage options: https://vercel.com/docs/storage
- SQLite architecture: https://www.sqlite.org/serverless.html

When sources disagree or provider behavior changes, prioritize current official documentation and record the date and impact of the decision.

## Owner decisions recorded 2026-11-25

- **Default locale:** Arabic. `/` redirects to `/ar`; explicit `/en` and `/ar` routes remain required.
- **i18n library:** next-intl, recorded in `docs/ADR-002-i18n-library.md`, replaces the hand-written dictionary plumbing for UI copy.
- **Production host:** Hostinger regular/shared hosting. This supersedes the earlier Vercel assumption. The chosen plan must include Node.js Web Apps; the SQLite file must live at a persistent path outside Hostinger's `hbuilds/` deployment directory. See `docs/ADR-001-deployment.md`.
- **Domain:** not purchased yet; `SITE_URL` and the GitHub OAuth callback remain pending.
- **Project localization:** project titles and descriptions remain in English by owner decision. The CV-derived About summary may be translated to Arabic, and that translation is now included.
- **Still pending:** asset storage and real interactive GitHub sign-in.
