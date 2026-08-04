# FED KIIT — 1:1 Next.js replica of FED-Frontend + FED-Backend

A pixel-for-pixel port of the React/Vite frontend and Express backend into a
single Next.js 16 App Router application.

The approach is deliberate: rather than re-approximating the design in Tailwind
(the first attempt, which drifted visibly), **the original SCSS modules were
carried over verbatim** — all 86 of them, plus every image asset. The components
keep their original markup and class names. That is what makes the replica
indistinguishable from the original rather than merely similar.

---

## Verified

Both apps were run side by side (Vite on :5173 + Express on :5000, Next on :3111)
and compared in the browser.

**Pixel parity — /Events**

| Measure | Vite original | Next replica |
|---|---|---|
| Total page height | 6109px | **6109px** |
| Page width | 1430px | **1430px** |
| `<img>` / `<button>` / `<a>` / `<p>` | 80 / 39 / 63 / 76 | **80 / 39 / 63 / 76** |
| Navbar | 1430 × 90 | **1430 × 90** |
| Event card | 352 × 313.448, `#2a2a2a`, radius 22.732px | **identical** |
| Register button | 128 × 38.520835876464844 | **identical** |
| Cover image | 350.67 × 208, radius 22.732px | **identical** |

**Pixel parity — /Team**

| Measure | Vite original | Next replica |
|---|---|---|
| Total page height | 9461px | **9461px** |
| `<img>` / `<a>` / `<p>` / headings | 64 / 27 / 63 / 72 | **64 / 27 / 63 / 72** |
| Member avatar | 180 × 180 | **180 × 180** |

**API byte-parity** — responses hashed and compared against the live Express
server, against the same MongoDB:

```
/api/form/getAllForms        IDENTICAL
/api/user/fetchTeam          IDENTICAL
/api/user/fetchAlumni        IDENTICAL
/api/blog/getBlog            IDENTICAL
/api/user/fetchAccessTypes   IDENTICAL
```

**Checks**

```
npm run typecheck    clean
npm run lint         0 errors
npm run build        54 routes
SSR audit            0 render-time / module-scope browser API access
CSS Modules audit    84 modules · 0 failed to compile · 0 impure selectors
```

The 298 lint *warnings* are all in `src/**` and are deliberate — see
"CSS Modules purity" and `eslint.config.mjs` for why the ported tree is held to
a different standard than code written for this project.

---

## URLs are identical

Routes keep the original React Router casing — `/Events`, `/Team`, `/Blog`,
`/Login`, `/SignUp`, `/PrivacyPolicy`, `/Events/:id/Form`, `/profile/...` — so
the address bar looks the same and existing links keep working. Lowercase
variants 308 to the canonical casing.

These redirects live in `proxy.ts`, not `next.config.ts`: Next matches a
redirect `source` case-insensitively, so a rule from `/Events` to `/events` also
matches `/events` and loops forever.

## Route guards — the redirect after sign-in

The original never navigated from inside `Login.jsx`. It called
`authCtx.login(...)` and let the **route table** react:

```jsx
<Route path="/Login" element={authCtx.isLoggedIn ? <LoginRedirect /> : <Login />} />
```

App Router routes are files, so nothing observes `isLoggedIn`, and `proxy.ts`
only runs on a server request — which a client-side sign-in never makes. The
first cut of this port dropped the behaviour: a correct login showed "Login
successful" and then sat on `/Login` forever.

**The redirect belongs in the components, not in a layout wrapper.** A guard in
`app/(auth)/layout.jsx` reacting to `isLoggedIn` was tried first and is wrong:
`SignUP.jsx` and `CompleteProfile.jsx` sign the user in and then navigate
themselves to `/`, and a layout guard cancels that in-flight `router.push`
before it commits. Measured on the signup flow — the push never reached
`history` at all, and a new account landed on `/profile` instead of `/`:

```
20494ms  resolve /api/auth/register
21025ms  history.replaceState(/Login?next=%2Fprofile)   <- guard won
         (no history.pushState(/) — SignUp's own push was discarded)
```

No delay fixes that reliably, because the push only commits once its RSC
payload arrives. So each component owns its own navigation, which is how the
ported source was already written: `Login.jsx`, `GoogleLogin.jsx` and
`GoogleSignup.jsx` all carry `shouldNavigate` / `navigatePath` state and an
effect that acts on it — dead code in the original precisely *because* the route
table did the job. Setting `setShouldNavigate(true)` after `authCtx.login(...)`
brings it to life. `SendOtp.jsx` already did exactly this and needed no change.

`src/utils/postAuthRedirect.js` resolves the destination the way `LoginRedirect`
did, plus the `?next=` the proxy appends. Because that value now comes off the
query string it is attacker-supplied, so anything that is not a plain internal
path is discarded — `//evil.com` included.

Verified in the browser by driving the real forms with the API stubbed at the
XHR layer:

| Flow | Start | Lands on |
|---|---|---|
| Login | `/Login` | **`/profile`** |
| Login | `/Login?next=/Events` | **`/Events`** |
| Login | `/Login?next=//example.com/phish` | **`/profile`** — origin preserved |
| Login | blocked page → login | **back to the blocked page**, `prevPage` cleared |
| Signup | `/SignUp` | **`/`** — matches the original |
| Login | stale localStorage, no cookie | **login form, one bounce, no loop** |

---

## What was ported

**All 122 components**, keeping the `.jsx` extension (tsconfig has `allowJs`
with `checkJs` off, so Next transpiles them without demanding annotations — the
markup stays faithful instead of being rewritten).

Home (Hero, About, Sponser, Feedback, Contact, Carousel, LiveEventPopup) ·
Events + PastEvent + EventCard + EventModal + EventForm + ShareModal ·
Team + TeamCard · Alumni · Blog + BlogCard + sidebars · Social · Chatbot ·
Login / SignUp / CompleteProfile / ForgotPassword / OTPInput / Google auth ·
Profile shell + Sidebar + ProfileView + EventsView + CertificatesView ·
Admin panel (ViewEvent, ViewMember, NewForm, AddEventForm, AddMemberForm,
BlogForm, Certificates forms + preview, EventStats, PreviewForm, SectionModal) ·
TeamManagement · AttendancePage · skeletons · micro-interactions.

**34 API endpoints** reproducing the Express contract exactly — same paths, same
JSON envelopes (`{ message, user, token }`, `{ success, data }`,
`{ success, message, events }`), because the ported components read those shapes
directly.

---

## Mechanical translations applied

| From (Vite/React Router) | To (Next.js) |
|---|---|
| `NavLink` / `Link` `to=` | `next/link` `href=` |
| `useNavigate()` → `navigate(x)` | `useRouter()` → `router.push(x)` |
| `useLocation().pathname` | `usePathname()` |
| `<Outlet />` | layout `children` |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| `import img from "x.png"` → `src={img}` | `src={img.src}` |
| `BrowserRouter` in index.jsx | App Router + `src/context/Providers.jsx` |

---

## SSR compatibility — audited clean

The Vite app only ever executed in a browser; under Next these also run on the
server. The following were fixed:

- `window.scrollTo(...)` called during render (Home, Error) → moved into a mount
  effect.
- `useState(window.innerWidth)` initialisers (`useWindowWidth`, `useDimensions`,
  Contact) → start at 0 and resolve on mount, with the resize handler invoked
  once so the value is correct immediately.
- `localStorage` read in a `useState` initialiser (AuthContext,
  RecoveryContext) → restored in a mount effect.
- `new JSConfetti()` at module scope → constructed lazily; its constructor
  touches `document`.

**Verification.** `next build` only prerenders reachable routes, so components
behind auth or inside click-opened modals were never exercised — a latent
instance would have surfaced as a runtime crash for a real user. All 125
components were therefore swept with a brace-depth scanner that flags
`window` / `document` / `localStorage` / `sessionStorage` / `navigator` accessed
at module scope or directly in a component body (as opposed to inside an effect,
handler, or other closure).

Result: **zero** remaining hazards. The two genuine browser-API constructors
(`new SpeechRecognition()` in the Chatbot, `new Html5QrcodeScanner()` in
AttendancePage) were confirmed to sit inside handlers, the former behind an
`'SpeechRecognition' in window` guard.

## CSS Modules purity — audited clean

- **46 impure selectors** across 18 modules. Vite leaves element selectors alone
  in CSS Modules (only class names are hashed), so `button { }` was already
  global; Next rejects it. They are wrapped in `:global(...)`, which emits
  exactly the CSS Vite did. Keyframe selectors (`from`, `to`, `0%`) are excluded
  — wrapping those is a Sass syntax error.
- `:root { --primary }` moved out of `Global.scss` into `globals.scss`; a
  `:root` rule inside a CSS Module is an impure selector.
- Two modules used Vite's absolute `@import "/src/assets/styles/Global.scss"`,
  which Next cannot resolve → rewritten as correct relative `@use`.

**Verification.** `next build` compiles only stylesheets that something imports,
so an unreachable module could still carry a defect. All 84 modules were
compiled directly through Sass and their output parsed for top-level rules that
target no class or id.

That audit caught a real bug the build had not: the automated wrapping pass
worked line by line, so on a selector list split across lines it wrapped only
the half on the line that opened the block —

```scss
input[type="number"]::-webkit-inner-spin-button,          /* left scoped */
:global(input[type="number"]::-webkit-outer-spin-button) { /* wrapped     */
```

leaving the number-input spin-button reset silently not applying. Fixed, and
re-verified: **84 modules · 0 failed to compile · 0 impure selectors**.

## The font bug worth knowing about

The original loaded Google Fonts with `@import url(...)` inside `index.scss`.
**Those rules do not survive Next's CSS bundler** — measured at runtime, the page
had **zero** registered "Open Sans" font faces against 183 in the Vite build. All
body text silently fell back to a system sans-serif and every line box was ~2px
shorter, which compounded into visibly different card and section heights.

Fonts are now loaded from `<link>` tags in `app/layout.tsx`. After the fix the
button measures `38.520835876464844px` in both builds — exactly equal.

---

## Configuration — the port is not hardcoded

The listening port comes from the environment, with the usual precedence:

```
shell environment  >  .env.local  >  .env
```

```bash
npm run dev          # uses PORT from .env.local (currently 3111)
PORT=4000 npm start  # shell wins
```

This needs a launcher (`scripts/with-env.mjs`) rather than being read by Next
directly, for two documented reasons:

1. Next **cannot** read `PORT` from a `.env` file — "booting up the HTTP server
   happens before any other code is initialized" (Next CLI reference). Something
   has to place it in the environment first.
2. Node's own `--env-file` flag does that, but `next build` forks worker
   processes and forwards CLI flags through `NODE_OPTIONS`, which rejects it
   outright: *"--env-file-if-exists is not allowed in NODE_OPTIONS"*. Verified —
   `dev` and `start` worked, `build` failed.

The launcher parses the env files itself and spawns `next` as a child process
with an explicit environment, so the flag never reaches `NODE_OPTIONS` and all
three commands behave identically. Every other variable is still loaded by Next
as normal; this only exists so `PORT` is available early enough.

## Endpoint coverage

All 48 Express endpoints are implemented. The later additions:

- **Team invites / join requests** — `inviteTeamMember`, `inviteLink/:formId`,
  `sendJoinRequest`, `joinRequestUpdates/:formId`, `allJoinRequestUpdates`,
  `respondJoinRequest`, alongside create / join / leave / rename / remove /
  search.
- **Attendance** — `markAttendance`, `attendanceCode/:id`,
  `export-attendance/:id`, `download/:id`.
- **Certificates** — `verifyCertificate`, `addCertificateTemplate`,
  `dummyCertificate`, `sendCertificatesAndEvents`, `testCertificateSending`.
- **Gemini helpers** — `gemini/autofill`, `gemini/summary`.
- **Profile image upload** — `user/editProfileImage`.
- **Chatbot email** — `chatbot/send-email`.

Two deliberate implementation differences:

- **Spreadsheets are CSV, not `.xlsx`.** The original streamed real workbooks via
  ExcelJS. CSV opens identically in Excel and Sheets and keeps a spreadsheet
  writer out of the bundle.
- **Certificate images are composited client-side.** The original used `canvas`
  and `puppeteer` server-side; neither deploys cleanly to a serverless runtime
  (`puppeteer` alone downloads a full Chromium). The template URL and field
  coordinates are returned instead — which is what the admin preview already
  does with html2canvas.

## Security fixes

`npm audit` went from **44 vulnerabilities (1 critical, 41 high) to 0**:

| Package | Action |
|---|---|
| `xlsx` | 0.18.5 from npm → **0.20.3 from the official SheetJS distribution**, which patches the prototype-pollution CVE. The npm package is stale; SheetJS moved distribution to their own registry |
| `react-share-social` | **Removed** — unmaintained, predates React 19, and bundled a legacy jest toolchain responsible for ~20 high advisories. Replaced with a local `ShareSocial` built on `react-share`, taking the same props so ShareModal only changed its import. Dropped 530 packages |
| `postcss`, `sharp` | Pinned to patched versions via npm `overrides`. npm's suggested fix for both was `next@9.3.3` — a downgrade to Next 9 — which is not a fix |
| `react-quill-new` | **Removed** — never imported, by the port or the original |

Two further problems surfaced while verifying, both inherited from the original
`.env` and both caught by the env schema in `lib/env.ts`:

- **`JWT_SECRET` was 4 characters.** A 4-character HMAC secret is brute-forceable
  in seconds, which means anyone could forge a session token for any account,
  including admins. Replaced with 64 bytes of CSPRNG entropy. **This rotates
  sessions** — everyone signs in once more. If you need session continuity for a
  phased cutover, set the old value back temporarily, but do not ship it.
- **`BCRYPT_SALT_ROUNDS` held a bcrypt salt string, not a cost factor.** The
  original frontend ran `parseInt()` over `$2b$10$Q0RPeouq…`, which yields `NaN`.
  Set to `10`, the cost embedded in that salt.

`POST /api/form/contact` also now validates the email format, length and message
length. The Express controller checked only for presence, so `email: "bad"` was
accepted and wrote unreplyable rows into `contactus`.

## Auth routes — verified

Every auth route was exercised against the running server, signed out and
signed in. `proxy.ts` is the gate; the numbers below are what it returned.

| Route | Signed out | Signed in |
|---|---|---|
| `/Login` `/SignUp` `/ForgotPassword` `/completeProfile` `/otp` | 200 | **307 → `/profile`** |
| `/profile` and all six sub-pages | **307 → `/Login?next=…`** | 200 |
| `/login` `/signup` `/forgotpassword` `/completeprofile` | 308 → canonical casing | — |

A forged or expired token is treated as no token, and the bad cookie is cleared
on the way out:

```
GET /profile   Cookie: token=<tampered>
307 → /Login?next=%2Fprofile
set-cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

The seven auth endpoints reject malformed input rather than failing open —
`login`, `register`, `verifyEmail`, `forgotPassword` and `googleAuth` all
answer 400 on an empty body, and `logout` is idempotent. `changePassword` is
the reset step and is gated on a single-use OTP, rate limited, and returns the
same message whether or not the account exists.

## Load time — the barrel files were the problem

The landing page was shipping **2.3 MB of JavaScript**. The cause is visible in
any dev-server warning trace:

```
./src/sections/Profile/Admin/View/VerifyCertificate/VerifyCertificate.jsx
./src/sections/Profile/index.jsx
./src/sections/index.jsx          <- re-exports Home *and* Profile
./src/views/Home/Home.jsx
./app/(main)/page.jsx
```

`Home.jsx` imported `{ Hero, About, Sponser, Feedback, Contact }` from the
`sections` barrel, which also re-exports `sections/Profile` — the entire admin
panel. Every one of those is a client component, so the bundler pulled the whole
graph into the landing page: certificate tooling, admin tables, the avatar
editor, event analytics. A visitor who only wanted the hero image downloaded the
admin panel. The `features` barrel did the same thing for `LiveEventPopup`.

Under Vite this cost nothing noticeable, because the dev server serves ES modules
untouched and the SPA loaded one bundle for every route anyway. Under Next each
route gets its own bundle, so a barrel import silently undoes the code splitting.

Fixed by importing the four components directly instead of through a barrel. The
barrels are untouched — other call sites still use them.

| Page | Before | After |
|---|---|---|
| `/` | 2317 KB | **1082 KB** |
| `/Events` | 2063 KB | **1082 KB** |
| `/Team` | 2014 KB | **1082 KB** |
| `/Login` | 1248 KB | **920 KB** |

Uncompressed. Over the wire the landing page is **327 KB** of JS and 55 KB of
HTML, and locally serves in TTFB 38 ms / DOMContentLoaded 135 ms / load 536 ms.

**Dev-server slowness is separate and expected.** `next dev` compiles each route
on first request, so a cold page can take seconds while production serves the
same page in 5–30 ms. Measure `npm run build && npm start`, never `npm run dev`.

## Invalid HTML nesting that only mattered under SSR — all of it

Four components wrapped block-level content in a `<p>`:

| Component | The nesting |
|---|---|
| `EventCard` | `<p>` → `div.price` → `<p>` |
| `EventModal` | `<p>` → `div.price` → `<p>` |
| `Hero` | `<p>` → `<span>` → `<h3>` |
| `Social` | `<p>` → `div.fed` → `<div>` |

Client-rendered under Vite none of this mattered: React builds the DOM node by
node, and nothing reparents a tree that already exists. Server-rendered it is
real markup, so the parser closes the `<p>` at the first block child and the
content lands as a *sibling* — a different layout, which React then reports as a
hydration mismatch.

Each wrapper is now a `<div>` carrying a class listed alongside the original
`p` selector, so the computed styles are unchanged. Verified in the browser:

| | Was styled by | Now computes to |
|---|---|---|
| `EventCard .meta` | `.eventname p` | 14.4px / flex / center / 1.6px |
| `EventModal .meta` | `.eventname p` | 14.4px / flex / center / 1.6px / #fff |
| `Hero .tagline` | `.largeContent p` | 39.2px / 700 / #fff |
| `Social .content` | `.text p` | 40px / 600 / #fff / center |

Hero keeps its `<h3>` rather than downgrading it to a `<span>` — the wrapper
changed instead, so the heading still counts as a heading.

`Social`'s wrapper is worth a note: `styles.content` had **no rule in the
stylesheet**, so the className resolved to `undefined` and did nothing — the
element was styled purely by `.text p`. `.content` now exists and carries those
declarations. (`EventCardModal.price` is undefined in the same way; both are
inherited from the original and left as they are.)

**`npm run audit:nesting` keeps it that way.** `scripts/audit-nesting.mjs`
walks a tag stack through every JSX file and reports any element the HTML parser
would reparent. It skips comments, string and regex literals — without that, a
comment mentioning `<p>` or a `.replace(/<a\s[^>]*>/gi, '')` gets read as markup,
which produced three separate rounds of false positives while writing it. The
scanner was validated by running it against the pre-fix files: it reports all
four real cases and nothing for the two false-positive files.

## Social embeds do not survive hydration

Fixing `Social`'s nesting uncovered a second, unrelated mismatch on the same
page: `react-social-media-embed` mints a fresh UUID per render and writes it
into both `id` and `className`, so the server's markup can never match the
client's. The embed sizes compound it — they come from `useDimensions()`, which
reads `window` and therefore measures 0 on the server.

`InstagramEmbed` and `LinkedInEmbed` are now loaded through `next/dynamic` with
`ssr: false`. Nothing is lost: the visible post is drawn by Instagram's and
LinkedIn's own scripts after mount, so the server-rendered markup was an
invisible placeholder either way. `/Social` renders the same four embeds at the
same 1674px page height, with the console clean.

`{ ssr: false }` is written out at both call sites because `next/dynamic` is a
compile-time transform and rejects a shared options variable —
*"next/dynamic options must be an object literal."*

## Smaller fixes from the same dev-server log

- `darken($accent-color, 10%)` in `VerifyCertificate.module.scss` is deprecated
  in Dart Sass. Replaced with `color.adjust($accent-color, $lightness: -10%)`,
  its documented equivalent — confirmed by compiling both and diffing the output
  (`rgb(80%, 43.2941176471%, 0%)` either way). The build no longer emits
  deprecation warnings.
- `<html>` carries `data-scroll-behavior="smooth"`, acknowledging the
  `scroll-behavior: smooth` that `globals.scss` sets, so Next stops warning and
  keeps the original's smooth scrolling.

Not fixed, deliberately: the `<Fit />` "height decreased" messages come from
`react-fit`, a transitive dependency of `react-date-picker`, when the calendar
popup is repositioned to fit the viewport. It uses the `warning` package, which
compiles to a no-op in production, so this is dev-only third-party noise.

## Admin forms & events — re-verified against the Express controllers

The calendar on the admin form page had **no styling at all**. The original
`index.scss` pulled in three vendor stylesheets; only one was carried over:

```scss
@import "react-date-picker/dist/DatePicker.css";   // was missing
@import "react-calendar/dist/Calendar.css";        // was missing
@import "react-datepicker/dist/react-datepicker.css";
```

`react-date-picker` draws its popup with `react-calendar`, so with `Calendar.css`
absent the picker opened as an unstyled column of numbers. Confirmed by grepping
the emitted CSS — **zero** `.react-calendar` rules shipped, now 50. In the
browser the popup measures 350×248 with a `#a0a096` border, which is
react-calendar's own default and therefore exactly what the original rendered.

Re-reading every form/event controller alongside its port turned up more:

**`getFormAnalytics` returned the wrong shape entirely.** `EventStats.jsx` reads
`response.data.form.formAnalytics`, `response.data.form.info` and
`response.data.yearCounts`; the port returned `{ success, message, data }`, so
`response.data.form` was `undefined` and the admin analytics panel threw. It now
returns `{ message, form, yearCounts }`, including the `yearCounts` histogram
built from registrants' `year` field, and the 404 for a form nobody has
registered to. Its access check is the controller's own allowlist
(ADMIN / PRESIDENT / VICEPRESIDENT / DIRECTOR_*) plus the `srex@fedkiit.com`
escape hatch, answering 401 "Access Denied" — not the `isMember` test the port
had invented.

**The attendance flow did not work.** The QR code carries a *signed JWT*:

| | Express | Port (before) |
|---|---|---|
| `attendanceCode` returns | `{ message, attendanceToken }`, a JWT expiring in 20 min | `{ success, data }` with the raw record id |
| `markAttendance` accepts | `{ formId, token }`, verifies the JWT | a bare ObjectId |

`QRCodeModal` reads `response.data.attendanceToken` — absent, so no QR was
generated — and `AttendancePage` posts the scanned JWT, which the port rejected
as not being a 24-character id. Both sides now match the original, including the
`formId` binding that stops one event's QR checking someone in at another, and
the `?teamCode=` branch. Verified by minting a token with the original's
`jsonwebtoken` call and verifying it with the port's `jose` code, and the
reverse:

```
Express-minted QR verifies in the port : true
Port-minted QR verifies in Express     : true
  lifetime (minutes)                   : 20
Tampered QR rejected                   : true
```

**Access levels corrected in both directions:**

| Endpoint | Express | Port (before) | Now |
|---|---|---|---|
| `export-attendance/:id` | `checkAccess("ADMIN")` | any club member | ADMIN |
| `markAttendance` | signed-in (its `checkAccess` is commented out) | any club member | signed-in |
| `getFormAnalytics/:id` | controller allowlist | any club member | allowlist |

`markAttendance` reads as the loosest of the three but is not: the door
volunteer signs in as a plain USER, so requiring member access locked the door
staff out, and the 20-minute signed QR is the actual control.

**Image dimensions were wrong.** Both controllers resize through Cloudinary at
fixed sizes; the port used 1000×1000 and 500×500 instead:

| | Express | Port (before) | Now |
|---|---|---|---|
| `addForm` FormImages | h 350.67 × w 196.37 | 1000 × 1000 | h 350.67 × w 196.37 |
| `addForm` QRMediaImages | h 400 × w 150 | 500 × 500 | h 400 × w 150 |
| `editForm` FormImages | h 350.67 × w 196.37 | 1000 × 1000 | h 350.67 × w 196.37 |
| `editForm` QRMediaImages | h 150 × w 400 | 500 × 500 | h 150 × w 400 |

The two QR rows are transposed relative to each other because `addForm` passes
`(QrImageWidth, QrImageHeight)` and `editForm` passes `(QrImageHeight, QrImageWidth)`
into the same `(height, width)` parameters. Each call site is reproduced as
written rather than reconciled. Note also that Express's helper is
`uploadImage(path, folder, height, width)` while this project's is
`(file, folder, width, height)`, so the arguments read transposed in the source
while sending identical values.

`addForm` also returns 200 with "Form created successfully", and `editForm`
"Form info and sections updated successfully", matching the originals.

**One divergence kept on purpose.** `addForm` in Express computes
`isPublic: Boolean(isPublic) || false` over a multipart field, and
`Boolean("false")` is `true` — so every event created through the admin form was
public, registration-closed and past regardless of the toggles. `editForm`
already used `isPublic === "true"`. The port uses the `editForm` form in both, so
the three switches actually work. Restoring byte-parity here would re-break them.

## OTP length — a hardening change that broke the screen

The password-reset email carried a **6-digit** code while every OTP screen in the
app renders **4 boxes**, so the code could not be typed in at all. Both the
reset flow and signup share `components/OtpInput`, and both were affected.

The UI was not at fault — it is 4 boxes in the original too, character for
character. The mismatch came from this port raising `OTP_LENGTH` from 4 to 6 as
a hardening measure, without a consumer that could accept six.

Reverted to 4, matching `generateOtp(4, false, false, false)`. The reasoning
behind 6 does not survive contact with the rest of this codebase: 10,000
combinations really are brute-forceable against the Express backend, which had
no throttling whatsoever, but `RATE_LIMITS.passwordReset` allows 6 attempts per
15 minutes and a code expires after 15 — so an attacker gets at most 6 guesses
out of 10,000 before the code they are hunting stops existing. The other OTP
hardening stays: codes are stored as a SHA-256 digest, compared in constant
time, single-use, and expiry is derived from `createdAt` rather than a
`setTimeout` that never fires on a serverless host.

One caveat carried over from `lib/api/rate-limit.ts`: the limiter is
in-process, so a horizontally scaled deploy multiplies the effective limit by
the instance count. A shared store is the follow-up if the app is scaled out.

Codes already issued before this change are 6 digits and cannot be entered;
they expire on their own within 15 minutes.

## Vite bundles all CSS; Next splits it per route

The disabled "Resend OTP" button on `/otp` rendered with a grey box around it.
Measured against the original running side by side:

| | Original (Vite) | Port (before) |
|---|---|---|
| `background-color` | `rgba(0, 0, 0, 0)` | `rgba(19, 1, 1, 0.3)` |
| `border` | `0px none` | `2px outset rgba(195,195,195,0.3)` |

That is the user-agent's disabled-button chrome showing through. The cause is
structural rather than a mistranslation. `TeamCard.module.scss` contains a
**top-level bare `button { }`** rule — Vite does not hash element selectors in
CSS Modules, and it bundles every module into one stylesheet for the SPA, so
that rule was live on every page of the original site. Next code-splits CSS per
route, so once ported it only loaded where `TeamCard` did: `/Team` and
`/profile/members`. Everywhere else, buttons lost their reset.

The rule is now declared in `app/globals.scss`, which reproduces the original
cascade. At specificity 0-0-1 every component's own class rules still win, so
nothing else moves — verified by diffing all three buttons on `/Login` between
the two apps: identical background, font-size, margins and box sizes.

**The same trap applies to ten other rules.** These are top-level `:global(...)`
selectors inside CSS Modules — app-wide under Vite, route-scoped here:

```
src/views/Event/styles/Event.module.scss:1                :global(*)
src/views/Event/styles/PastEvent.module.scss:1            :global(*)
src/views/TermsAndConditions/styles/T&C.module.scss:2     :global(*)
src/components/EventCard/styles/EventCard.module.scss:261 :global(a)
src/layouts/Blog/TabBar/styles/TabBar.module.scss:24      :global(ul)
src/sections/Home/Feedback/styles/Feedback.module.scss:15 :global(::-webkit-scrollbar)
src/sections/LiveEvents/Omega/Attend/styles/Attend.module.scss:77 :global(img)
src/components/Core/styles/Core.module.scss:103-104       :global(input[type="number"]::-webkit-*-spin-button)
src/authentication/Login/ForgotPassword/styles/forgotPassword.module.scss:1 :global(:root)
```

Only the `button` one is fixed here, because it had a visible, reported symptom
and a verified before/after. The `:global(*)` rules in particular would change
layout on every page and need reviewing one at a time rather than hoisting
wholesale. The `:root` entry is already harmless — it only defines `--primary`,
which `globals.scss` also defines.

## The Chatbot was missing from every auth screen

App.jsx renders `<Chatbot />` above `<Routes>`, so it appears on every route.
The port mounted it in the `(main)` layout, which hid it on `/Login`, `/SignUp`,
`/otp`, `/ForgotPassword` and `/completeProfile`. Moved to the root layout,
inside `Providers` since it reads `AuthContext`. Confirmed present in the
server-rendered HTML for all six routes checked, and the toggle now measures
`72x72` on `/Login` in both apps.

## Request-body field names — audited

`/otp` rejected a correct code with "Email, otp and password are required".
`OtpInput.jsx` posts `{ newPassword, confirmPassword, otp, email }`, matching
Express; this port's handler destructured `password`, so the check failed before
the code was ever looked at. Fixed, along with the rest of that controller's
contract, which had also been simplified away:

- 400 `"Missing fields."` when any of the four is absent
- 409 `"Conflict : New Password and confirm Password did not match!!"`
- 404 `"User not found!"` — Express's `checkAccess` looks the account up by the
  body's `email`, which is also why the endpoint works without a session
- 400 `"New password cannot be same as the old password ! Instead try login"`
- 200 `{ status: "OK", message: "Password has been changed successfully !!" }`

This was the third contract break found by report rather than by testing, so
`npm run audit:contracts` now walks every `api.*()` call in the components,
resolves it to its Route Handler, and flags payload keys the handler never
reads. It found two more live ones:

| Endpoint | UI sends | Handler read | Effect |
|---|---|---|---|
| `renameTeam` | `newTeamName` | `teamName` | every rename failed on an empty name |
| `sendJoinRequest` | `teamRegistrationId` | `teamCode` | every join request rejected |

Both now match Express, including `sendJoinRequest` identifying the target by
registration row id — the value `searchTeams` already returns to the UI as
`teamRegistrationId` — rather than by team code, with the explicit
`team.formId !== formId` check that a global row id makes necessary.

## Certificate endpoints are largely unimplemented

The audit also showed the admin certificate tooling calling endpoints that do
not exist here. Express exposes **15** certificate routes; this port has 5, and
one of those (`addCertificateTemplate`) has no counterpart upstream at all.

Five of the missing ones are called by
`CertificatesForm/tools/certificateTools.js` and so are reachable from the admin
panel today: `getEvent`, `getEventByFormId`, `createOrganisationEvent`,
`sendBatchMails`, `sendCertViaEmail`. The remainder — `getCertificateTest`,
`getOrganisationEvents`, `addAttendee`, `createEvent`, `getCertificate`,
`testNamePosition` — are unreferenced by the UI.

This is a gap, not a regression: it was never built. It is called out here
rather than fixed in passing because the certificate flow already carries a
deliberate architectural deviation (images composite client-side instead of
through `canvas`/`puppeteer`), so completing it is a design decision rather than
a translation.

## `useSearchParams` has a different shape in Next

React Router returns `[params, setParams]`; Next returns the params object
itself. Components that kept the array destructuring crash:

```jsx
const [searchParams] = useSearchParams();   // wrong under Next
const searchParams = useSearchParams();     // correct
```

`ReadonlyURLSearchParams` is iterable, so destructuring it as an array does not
throw — it quietly yields the first `[key, value]` entry, or `undefined` when the
URL has no query string. The next `.get()` then fails with "Cannot read
properties of undefined (reading 'get')".

Fixed here in `EventForm.jsx` (the event registration form) and
`VerifyCertificate.jsx` (certificate verification).

`EventForm` is the one that hid. It reads `searchParams.get("teamCode")` during
render, but `ProtectedRoute` redirects signed-out visitors first, so an anonymous
smoke test returns 200 and only a signed-in user ever reaches the crash.

Swept the tree for the rest of the React Router surface (`useNavigate`,
`useLocation`, `Outlet`, `Navigate`, `to=`): only comments remain.

## Team management — rebuilt against the Express controllers

The five components (`TeamManagement`, `MemberCard`, `InviteSection`,
`TeamlessState`, `ConfirmDialog`) were already ported line for line. The backend
behind them was not: it had been written against a **different data model**, so
most of the page did not work.

**The model.** A team is one `formRegistration` row. It holds every member's
address in `regTeamMemEmails` and every member's form answers in `value`, and its
`userId` is the leader. Leaving or being removed means lifting a person's entries
out of that row and giving them their own `UNAFFILIATED` row, so they stay
registered for the event and can join or start another team. The port had assumed
a row per member sharing a `teamCode`, with the earliest row treated as leader.

That single wrong assumption produced most of the faults:

| Endpoint | Fault | Effect |
|---|---|---|
| `teamDetails/:formId` | looked the registration up by `userId` | **only the leader could load the page** — every other member got "no registration found". Confirmed against live data: the ownership query returns `NULL` for a real member of team "ABC", the membership query finds the team |
| `teamDetails/:formId` | returned `registrationId, regTeamMemEmails, isLeader` | the UI reads `eventTitle`, `leaderEmail`, `maxTeamSize`, `minTeamSize`, `isRegistrationClosed`, `isEventPast` and `data.isTeamless`, none of which existed, and members lacked `college` and `year` |
| `teamDetails/:formId` | no `UNAFFILIATED` branch | `TeamlessState` — the whole create/join flow — could never render |
| `searchTeams/:formId` | returned a flat array of `{teamName, teamCode, size, maxSize, isFull}`, read `?q=` | the picker reads `data.data.teams` with `teamRegistrationId`, `teamSize`, `maxTeamSize`, `leaderName`, `spotsRemaining`, `hasPendingRequest`, and sends `?search=`. The list rendered empty and the search box filtered nothing |
| `leaveTeam` | keyed on `userId`; no leader/member distinction | a member could not leave; nobody's answers were carried across; the tracker's `regTeamNames` was never released |
| `removeTeamMember` | assumed row-per-member | removal did not work, and the removed member got no email |
| `renameTeam` | read `teamName` | UI sends `newTeamName` — every rename failed |
| `sendJoinRequest` | read `teamCode` | UI sends `teamRegistrationId` — every request rejected |

Also restored: `leaveTeam` blocks a leader who still has members
("You must remove all team members before leaving…"), the closed-registration
guard compares the flags as the **strings** `"true"`/`"false"` the data actually
stores, `joinTeam` returns `eventId` (falling back to `formId` when
`relatedEvent` is absent or the literal string `"null"`),
`joinRequestUpdates` returns `pendingCount`, and the removed-member email is
sent, following `emailTemplates/removedMember.html`.

Every success message now matches the original, because the components put
`response.data.message` straight into a toast — `Team "X" created successfully!`,
`Successfully joined team "X"!`,
`Successfully dissolved|left the team "X". You can now create or join another team.`,
`Successfully removed a@b.com from the team & informed through a@b.com`,
`Invitation sent to a@b.com`.

**Verified against the live database**, read paths only:

```
teamDetails as leader  -> team ABC, size 2, max/min 3/1, eventTitle,
                          leaderEmail, members with year + college
teamDetails as member  -> identical payload (previously: nothing)
teamDetails teamless   -> isTeamless true, eventTitle, max/min 5/3
searchTeams            -> data.teams[] with teamRegistrationId, leaderName,
                          spotsRemaining, hasPendingRequest
searchTeams?search=AB  -> filters to "ABC"
inviteLink             -> inviteLink, teamCode, teamName, shareText
joinRequestUpdates     -> { updates: [], pendingCount: 0 }
```

The mutations (`createTeam`, `joinTeam`, `leaveTeam`, `removeTeamMember`,
`renameTeam`, `inviteTeamMember`, `sendJoinRequest`) are **not** exercised here:
this database holds real registrations, and running them would rewrite other
people's teams. They are matched to the controllers line by line and typecheck
clean, but they want a run-through on a scratch database before release.

## The team page hit the same `useSearchParams` bug

`TeamManagement.jsx` carried the React Router destructuring described above, so
opening any team page crashed with *"Cannot read properties of undefined
(reading 'get')"*.

It also cleaned the URL after showing an email-redirect toast by mutating the
params and calling the setter. Next's object is read-only and has no setter, so
that is now a copy plus `router.replace(..., { scroll: false })` — same outcome:
the toast does not re-fire on refresh and no history entry is added.

Verified in the browser against live data: the team page renders in full for a
non-leader member (team, code, 2/3 members with year and college, "You" marker,
Leave Team) and for the leader (invite panel, share link, per-member remove),
`?toast=joined&name=…` is consumed and stripped from the URL, and the console is
clean on both.

## Invite links resolve to the deployed domain

`inviteLink` is built from the request, not hardcoded, so a browser on
production produces a production URL. The localhost you see in development is
development's own origin.

The origin is now checked against an allowlist before being used. `Origin` and
`Host` are set by the caller, and these URLs go into **email** — the team
invitation, and the accept/reject buttons sent to a team leader. Reflected
unchecked, anyone able to create a team could have FED KIIT send a message, from
its own address, containing a link to a domain of their choosing. The Express
controller did reflect them
(`req.headers.origin || process.env.FRONTEND_URL || "https://fedkiit.com"`);
this is the one place the port deliberately does not follow it.

An origin is trusted when it matches `NEXT_PUBLIC_SITE_URL`, or is localhost so
a developer's copied link works on their machine. Anything else falls back to
`NEXT_PUBLIC_SITE_URL`. Measured:

| Request | Link produced |
|---|---|
| `Origin: https://www.fedkiit.com` | `https://www.fedkiit.com/Events/…` |
| `Origin: http://localhost:3999` | `http://localhost:3999/Events/…` |
| `Origin: https://evil.example` | falls back to the real host — attacker domain dropped |
| `Host: evil.example` | `https://www.fedkiit.com/Events/…` |

**`NEXT_PUBLIC_SITE_URL` must be set correctly in the production environment**;
it is what every fallback resolves to.

## Team invite links now survive signing in

Clicking an invite while signed out sent you to the login page and then, after
signing in, dropped you on the team-finding page instead of joining the team.

The auto-join itself was never the problem — it was ported and works. The
destination was being thrown away during authentication, in four places:

| Where | What it did |
|---|---|
| `Login.jsx` — the "Sign Up" link | overwrote `prevPage` with `/Login`, discarding the invite `ProtectedRoute` had just saved |
| `SignUP.jsx` | `router.push("/")` after signing up |
| `GoogleSignup.jsx` | cleared `prevPage`, then resolved to `/profile` |
| `CompleteProfile.jsx` | `router.push("/")` |

So the very case an invite is for — someone without an account — lost it before
signing up. All four now resolve through `postAuthRedirect()`, which takes a
fallback so the signup screens still default to `/` as they always did.

Measured through the real UI, with the login and join calls stubbed so nothing
was written:

```
open invite signed out -> /Login
                          prevPage = /Events/<id>/Form?teamCode=40-002-7161
click "Sign Up"        -> prevPage unchanged   (previously: "/Login")
sign in                -> POST /api/auth/login
                          POST /api/form/joinTeam {formId, teamCode:"40-002-7161"}
                       -> /Events/<id>/team
```

Both the email and WhatsApp links carry the same `?teamCode=`, so both behave
identically.

**A new account still has to fill in the event's registration form.** Team
membership is a `formRegistration` row: there is nothing to move onto a team
until the person has registered for the event, and that form is where required
details and any payment are collected. The invite is carried through it —
`EventForm` passes the code to `PreviewForm`, which joins the team the moment
registration succeeds. Someone who is *already* registered skips all of that and
joins on the spot, which is the flow shown above.

## A failed auto-join no longer fails silently

`PreviewForm` joins the invited team as soon as registration succeeds. When that
join was rejected it did nothing but `console.error`, then fell through to
`router.push("/Events")` — the person landed on the events listing, registered
but teamless, with no indication that the invite had not been honoured. The same
silent fall-through is in `FED-Frontend/src/features/Modals/Profile/Admin/
PreviewForm.jsx:191-194`, so this is inherited rather than a port defect, but it
is reachable in ordinary use: invite links get shared in group chats, and the
last person to act on one finds the team full.

Two paths were silent, not one. Besides the `catch`, a `200` carrying
`success: false` also fell through untouched. Both now redirect to
`/Events/<formId>/team?toast=join_failed&reason=<api message>`.

That destination is deliberate. The person *is* registered at that point, just
unaffiliated, so `TeamManagement` renders `TeamlessState` — the team search. They
arrive on the screen that lets them fix the situation instead of the events
listing.

The reason is forwarded rather than hard-coded because the same path catches
four different rejections from `joinTeam`:

| API message | What happened |
| --- | --- |
| `This team is full` | filled up while they were registering |
| `Invalid team code` | team disbanded or the link is stale |
| `Registration is closed for this event` | deadline passed mid-flow |
| `You are already in a team` | duplicate submit |

`TeamManagement` appends "You can join another team below." and strips `reason`
from the URL alongside `toast` and `name`, so the toast does not re-fire on
refresh.

Not exercised against the database: `joinTeam` is a mutation and the configured
Atlas instance holds real registrations. The redirect and the toast are verified
by build and by reading the path; the full-team rejection itself wants a scratch
database.

## Team mutations — exercised against the database, and four defects found

Previously only the read paths were verified; the mutations were matched to the
controllers by eye and explicitly flagged as unrun. Running them end to end with
two real accounts on the "Team Test" event found four defects that reading had
missed.

**1. `joinTeam` failed outright (500).** `formRegistration` carries
`@@unique([formId, teamCode])` — the model is **one row per team**, with the
whole roster in `regTeamMemEmails`, not one row per member. The port stamped the
team's code onto the joiner's own row, which collides with the team row on that
constraint. Every join died with a Prisma P2002 surfaced as a 500. Joining is a
*merge*: the joiner's email and their `value` entry move onto the team row and
their solo row is deleted.

This is the mutation the entire invite-link flow depends on, so the flow could
not have worked in production.

**2. `respondJoinRequest` failed the same way**, for the same reason, so a leader
accepting from their email got the generic error page and the request stayed
PENDING for ever.

**3. `renameTeam` had no leader check at all.** Any member could rename the team.
The controller looks the row up by membership and compares its owner to the
caller; the port loaded the caller's own row and compared nothing. It was also
missing the registration-closed check, the "name unchanged" no-op, and the
tracker's name swap — so a rename left the old name reserved for ever.

**4. Team codes were generated in the wrong shape.** The controller builds
`<2-letter event code>-<3-digit index>-<4 digits>` (`AR-003-8793`); the port
built a slug of the *team* name (`CLAUDETE-7130`). Every code already in the
database uses the first shape, and people share these by hand — a second shape
makes a valid code look fake.

Two message mismatches went with them: `createTeam` used a **commented-out v1
string** from `addRegistration.js` rather than the live one, and `renameTeam`
invented its own.

One deliberate deviation was kept. The controller lets a teamless registrant
rename their own `UNAFFILIATED` placeholder, which produces a named "team"
carrying a `SOLO-<userId>-<n>` code and absent from the tracker — a row nothing
else expects. That is guarded here.

### What was run

Event "Team Test", two accounts belonging to the repo owner, restored to their
original state afterwards. No team containing anyone else was touched — every
event both accounts share has a third party in one of their teams, so account A
was registered for "Team Test" to get two free accounts in one event.

```
createTeam · duplicate name · searchTeams · joinTeam (valid, invalid code,
already-on-a-team) · renameTeam (leader, non-leader 403, unchanged no-op) ·
inviteTeamMember · removeTeamMember (leader, non-leader) · leaveTeam (member,
leader-last) · sendJoinRequest (new, duplicate) · respondJoinRequest (accept,
replay) · teamDetails after every step
```

20/20 asserted steps pass; both accounts end `TEAMLESS` with no leftover PENDING
requests.

`checkJoinRequestUpdates` filtering on `requesterEmail` is **correct**, not a
bug: it is the requester's view of their own requests. Leaders are notified by
email only, so a leader legitimately sees `pendingCount: 0`.

### Renaming a team and replacing one are different things

A pending request used to survive the dissolution of the team it pointed at, and
became live again the moment that leader created their next team. A leader could
disband "ABC", create "BCD", and the person who had asked to join ABC would be
pulled into BCD without ever agreeing to it.

`teamRegistrationId` cannot tell the two apart — the registration row is reused,
so its id survives a rename *and* a disband. Verified rather than assumed: after
a disband and a fresh createTeam, the request's `teamRegistrationId` still equals
the new team's row id.

**`teamCode` is the discriminator.** A rename leaves it untouched; disbanding
resets it to a `SOLO-…` code and the next `createTeam` mints a fresh one. So
`teamJoinRequest` now pins the code at the time of asking, and acceptance
compares it:

| Leader does | Team code | Pending request | Invite link |
| --- | --- | --- | --- |
| renames ABC → BCD | unchanged | **still accepted** | **still works** |
| disbands ABC, creates BCD | new | **auto-expired** | **404** |

The invite-link path already behaved correctly — those links carry
`?teamCode=`, so a rename keeps them valid and a disband invalidates them — but
it was confirmed against the database rather than taken on trust.

`teamCode` on `teamJoinRequest` is optional: rows written before it existed do
not carry one, and a request that cannot be verified is treated as stale. There
were 45 requests in the database when this shipped and **none** of them pending,
so nothing was grandfathered. MongoDB needs no migration for an optional scalar
with no index — `prisma generate` is enough, no `db push` against production.

Proven end to end on the live database, 9/9 assertions: rename keeps the code and
the request is accepted into the renamed team; disband-and-recreate changes the
code, the row id is demonstrably reused, the requester is *not* pulled in, and
the request lands in `AUTO_EXPIRED`; the invite link survives the rename and dies
on the disband.

## Pulling a schema change does not break anyone

The generated Prisma client lives in `node_modules/.prisma/client`, which is
gitignored, so it never travels with a commit. `@prisma/client` has its own
postinstall hook, but npm only fires that during an install — and a schema change
on its own does not touch `package.json`, so nobody has a reason to reinstall.

That combination is the trap: pulling a branch that changed `schema.prisma`
leaves a client that no longer matches it, the app starts perfectly, and the
mismatch only surfaces as `Unknown argument …` on whichever request happens to
touch the new field. `npm run build` and `npm run typecheck` do fail loudly, but
`npm run dev` does not type-check up front, so the usual workflow hides it.

`scripts/ensure-prisma.mjs` runs the check where it cannot be skipped —
`with-env.mjs` calls it, and `dev`, `build` and `start` all go through that.

It regenerates **only when the schema has actually changed**, comparing a
SHA-256 of `schema.prisma` against a stamp written beside the generated client.
Generating unconditionally would add seconds to every dev start; hashing one file
is imperceptible, so the common case is free. The stamp lives inside the client
directory deliberately: deleting `node_modules` takes it along, so a wiped
install can never look up to date. It is written only after a successful
generate, so a failure retries rather than marking a client that was never
produced as current.

`postinstall` runs the same script with `--optional`, which tolerates a missing
CLI: `prisma` is a devDependency, so `npm install --omit=dev` on a deploy host
legitimately has none, and failing there would break the install. Running a dev
server without one is not legitimate, so that path leaves the flag off and fails.

`npm run prisma:generate` is the manual escape hatch.

Verified: no stamp → generates; unchanged schema → silent, no `prisma generate`
spawned; changed schema → detected and regenerated, both standalone and through
a real `npm run dev`, which then served `/api/health` 200. `npm install` still
exits 0 with the new hook.

## Google sign-in was rejecting every request

Two defects stacked on top of each other, both introduced by this port.

**The body field never matched.** `GoogleLogin.jsx` and `GoogleSignup.jsx` post
`{ access_token }`, as they always did against Express. The route read
`credential || token || tokenId`, matched none of them, and returned
400 *"Google credential is required"* — before Google was contacted at all. So
Google sign-in and sign-up failed for everyone, every time.

**The token type was wrong underneath.** The route then handed the value to
`OAuth2Client.verifyIdToken`, which expects an ID token (a JWT). Neither
component ever produces one: both use `useGoogleLogin` without a `flow` option,
which is the implicit flow, and its response carries an opaque **access token**.
Verifying it locally is not possible — it is not a JWT and carries no claims.
Handing it back to Google is what establishes whose it is, which is exactly what
the controller does:

```js
`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
```

Now matched, with one deliberate difference: the token goes in an
`Authorization: Bearer` header instead of the query string. Same endpoint, same
response, but a credential in a URL ends up in proxy and server logs.

Also restored from the controller and previously missing: the display name is
built from `given_name` + `family_name` before falling back to `name`, and a
`hd === "kiit.ac.in"` account gets `college`, `rollNumber`, `year` and `school`
derived from the roll number. That derivation was checked against the
controller's inline version across six roll numbers spanning 1st year to
Passout — identical output on all six.

Error mapping: Google answering 401/403 becomes a 401 (the caller's token is
bad, not a server fault), any other non-OK becomes 502, and a transport failure
becomes 503 — where an unhandled throw would otherwise have surfaced as a 500.

Status codes now follow the controller: 201 when the account was just created,
200 otherwise, with the message `"LOGGED IN"` in both cases.

Verified against the live Google endpoint: an empty body gives
400 *"Missing fields: access_token"*; an invalid `access_token` gives **401**,
proving the request now reaches Google instead of being turned away at the door.
A full popup sign-in needs a browser and was not automated.

### Google Cloud console

The implicit flow validates **Authorized JavaScript origins**, not Authorized
redirect URIs — those apply to the server-side auth-code flow, which no app on
this client id uses (checked across FED-Backend, FED-Frontend and this repo: no
`redirect_uri`, no auth-code flow, no OAuth callback route).

So local development needs `http://localhost:3111` as a JavaScript **origin**
— scheme, host and port, no path. `https://fedkiit.com` is not needed alongside
`https://www.fedkiit.com`: the apex 308-redirects to `www`, so the browser is
never on the apex origin.

## Known issues

- **`/ForgotPassword` reloads instead of submitting.** Its `<form>` has no
  `onSubmit` and `Button` renders an untyped `<button>`, so "Send OTP" submits
  natively and the page navigates to `?email=…` before the 1.5s handler can run.
  Reproduced identically in the original — inherited, not a port defect. Left
  alone because fixing it changes behaviour rather than restoring it.
- **`/profile/members` and `/profile/BlogForm` are not access-gated in the UI.**
  App.jsx only registered those routes for `ADMIN` (and `SENIOR_EXECUTIVE_CREATIVE`
  for the blog form), so a non-admin hitting the URL fell through to the error
  page; here they render for any signed-in user. Every mutation behind them is
  still enforced server-side — `createBlog` checks `canManageBlogs`, `addMember`
  and `editDetails` return 403 — so the exposure is the admin screen itself, not
  the ability to use it. The data it lists comes from `fetchTeam`, which is
  public either way (see below).
- **`checkAccess("USER")` is stricter in Express than here.** It passes only when
  `access === "USER"` (or ADMIN), so club executives could not register for an
  event, create or join a team, or fetch their attendance code — they got a 403.
  The ported routes require a signed-in user instead, which lets staff use those
  features. Worth a decision rather than a silent change: matching Express
  exactly would start returning 403 to every executive account.
- `GET /api/form/allJoinRequestUpdates` answers `{ updates: [] }` to anonymous
  callers where Express returned 401. App.jsx polls it on load, so a 401 logged
  an error on every signed-out page view.
- `/api/user/fetchTeam` returns members' email addresses to anonymous callers.
  Preserved deliberately: trimming the projection changes the response bytes and
  the Team page's sort order. Worth fixing, but it is a behaviour change, not a
  port defect.
