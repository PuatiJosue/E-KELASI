---
name: verify
description: Build, launch and drive the E-KELASI Next.js app in a real browser to observe a change working.
---

# Verify E-KELASI

Next.js 14 (App Router) + Supabase. Verification = drive the real page in a browser.

## Memory gotcha (hits first, wastes the most time)

This machine has ~7.4 GB RAM and is usually near-full. Node OOMs with a
**native stack trace** (`npm run build`) or `Array buffer allocation failed`
(`next dev`) — neither is a code error.

```powershell
$env:NODE_OPTIONS = "--max-old-space-size=4096"; npm run build
```

Chrome and a 4 GB-heap dev server together exceed available RAM: Chrome then
fails to launch with `The paging file is too small for this operation`. Run the
dev server with a **modest heap** (or default) when also driving a browser, and
close other Node processes first. Check headroom:

```powershell
$os = Get-CimInstance Win32_OperatingSystem; [int]($os.FreePhysicalMemory/1KB)
```

## Launch

```powershell
Start-Process cmd.exe -ArgumentList "/c npx next dev -p 3111 > `"$env:TEMP\ek-dev.log`" 2>&1" -WindowStyle Hidden
```

Wait on `curl -s -o /dev/null http://localhost:3111/...` in a loop — do **not**
use Playwright's `waitUntil: 'networkidle'`, it never settles because of the HMR
websocket. Use `domcontentloaded` + a short timeout.

## Auth is the main obstacle

`src/middleware.ts` gates `/overview`, `/schools`, `/billing`, `/school/*`,
`/teacher/*` by Supabase session **and** `profiles.role`
(`super_admin` / `school_admin` / `teacher`). No super_admin test account is
available locally.

For **presentation-only** changes (layout, overflow, responsive), mount the real
component on a temporary unprotected route — middleware ignores unknown paths:

```tsx
// src/app/verify-modal/page.tsx — TEMPORARY, delete after
import { LangProvider } from "@/lib/i18n";
import { Shell } from "@/components/Shell";
import { InviteSchoolButton } from "@/components/admin/InviteSchoolModal";
export const dynamic = "force-dynamic";
export default function P() {
  return (
    <LangProvider value="fr">
      <Shell sidebar={<div />} topbar={<div style={{ height: 56 }} />}>
        <div style={{ padding: 24 }}><InviteSchoolButton /></div>
      </Shell>
    </LangProvider>
  );
}
```

This is faithful for layout because `globals.css` loads from the root layout and
no ancestor of the modal creates a containing block for `position: fixed`
(`.ek-shell`/`.ek-main` use `overflow: hidden`, which does not; the only
`transform` is on `.ek-sidebar`). **Delete the route afterwards.**

For data/permission behaviour this harness is *not* valid — you need a real session.

## Drive

Playwright is not a dependency; use it via npx (Chrome is installed, no download):

```js
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
```

Assert against geometry, not vibes — `getBoundingClientRect()` vs
`window.innerHeight`, and `scrollHeight`/`clientHeight` on the scroll container.
Confirm real hit-testability with `.hover()`, not just paint.

## Do not submit forms that write

`inviteSchoolAction` and the finance/enrolment actions hit the **live Supabase**
(`.env.local` points at the real project). Verify that controls are reachable and
enabled; don't actually submit.

## Responsive breakpoint

`globals.css` stacks grids at `max-width: 900px` via `.ek-stack-md`
(`grid-template-columns: 1fr !important`), so forms get much taller on phones —
that is where overflow bugs appear. Modals cap height with
`maxHeight: "90vh", overflowY: "auto"` on the `.ek-card`. Note `.ek-shell` uses
`100dvh` deliberately for mobile browser chrome, while modals use `vh`.
