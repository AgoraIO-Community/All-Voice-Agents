# Landing Page and Maya Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copy the landing-page experience from `origin/feature/landing-page` onto `main` so `/` shows the landing page and selecting Maya opens the preserved voice-agent console at `/maya`.

**Architecture:** Keep routing dependency-free: `App` maps `window.location.pathname` to either the landing page or Maya and listens for `popstate`. Split landing and voice experiences into focused components with separately scoped CSS; copy only the landing image and UI source, while retaining every backend, API, environment, and workspace file from `main`.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest, Testing Library, ElevenLabs React SDK, browser History API, CSS.

## Global Constraints

- Do not merge or rebase `origin/feature/landing-page`.
- Preserve the backend, ElevenLabs integration, API client, environment configuration, workspace configuration, and package dependencies from `main`.
- Copy only the landing-page UI code, required styles, and `kiril-dobrev-v63UL8s28Ew-unsplash.jpg`.
- `/` renders the landing page; `/maya` renders the current `main` voice-agent experience.
- The Maya action performs in-app navigation to `/maya`.
- Preserve the Concierge/Aasrav telephone behavior from the landing-page branch.
- Do not add a routing dependency.
- Unknown paths render the landing page.
- Keep landing and voice styles scoped to their respective page roots.

## File Structure

- Create `apps/frontend/src/appRoute.ts`: pure mapping from a URL pathname to the app route.
- Create `apps/frontend/src/appRoute.test.ts`: route mapping unit tests.
- Create `apps/frontend/src/test/setup.ts`: Testing Library cleanup shared by component tests.
- Create `apps/frontend/vitest.config.ts`: jsdom test configuration.
- Modify `apps/frontend/package.json`: add the frontend test command and test-only dependencies.
- Modify `package-lock.json`: lock the test-only dependencies installed through npm.
- Create `apps/frontend/src/LandingPage.tsx`: copied landing behavior with an `onSelectMaya` boundary.
- Create `apps/frontend/src/LandingPage.css`: landing styles copied and scoped from the feature branch.
- Create `apps/frontend/src/LandingPage.test.tsx`: Maya and Aasrav interaction tests.
- Create `apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg`: exact hero image from the feature branch.
- Create `apps/frontend/src/VoiceAgentPage.tsx`: existing `main` voice console extracted without behavioral changes.
- Create `apps/frontend/src/VoiceAgentPage.css`: current voice-console styles scoped under `.voice-agent-page`.
- Modify `apps/frontend/src/App.tsx`: dependency-free route controller.
- Modify `apps/frontend/src/App.css`: shared reset only, with page-specific presentation removed.
- Create `apps/frontend/src/App.test.tsx`: route navigation and browser-history integration tests.

---

### Task 1: Frontend Test Harness and Route Mapping

**Files:**
- Modify: `apps/frontend/package.json:6-27`
- Modify: `package-lock.json`
- Create: `apps/frontend/vitest.config.ts`
- Create: `apps/frontend/src/test/setup.ts`
- Create: `apps/frontend/src/appRoute.ts`
- Test: `apps/frontend/src/appRoute.test.ts`

**Interfaces:**
- Produces: `type AppRoute = "landing" | "maya"`.
- Produces: `getAppRoute(pathname: string): AppRoute`.
- Consumes: no application interfaces.

- [ ] **Step 1: Install and configure the frontend test runner**

Run from the repository root:

```bash
npm install --save-dev --workspace frontend vitest jsdom @testing-library/react @testing-library/user-event
```

Add the test script to `apps/frontend/package.json` without changing existing scripts or runtime dependencies:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

Create `apps/frontend/vitest.config.ts`:

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `apps/frontend/src/test/setup.ts`:

```typescript
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});
```

- [ ] **Step 2: Write the failing route mapping test**

Create `apps/frontend/src/appRoute.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { getAppRoute } from "./appRoute";

describe("getAppRoute", () => {
  it("maps only /maya to the Maya voice page", () => {
    expect(getAppRoute("/maya")).toBe("maya");
  });

  it.each(["/", "/explore", "/concierge", "/unknown"])(
    "maps %s to the landing page",
    (pathname) => {
      expect(getAppRoute(pathname)).toBe("landing");
    },
  );
});
```

- [ ] **Step 3: Run the route test and verify it fails**

Run:

```bash
npm test --workspace frontend -- src/appRoute.test.ts
```

Expected: FAIL because `./appRoute` does not exist.

- [ ] **Step 4: Implement the route mapping**

Create `apps/frontend/src/appRoute.ts`:

```typescript
export type AppRoute = "landing" | "maya";

export function getAppRoute(pathname: string): AppRoute {
  return pathname === "/maya" ? "maya" : "landing";
}
```

- [ ] **Step 5: Run the route test and verify it passes**

Run:

```bash
npm test --workspace frontend -- src/appRoute.test.ts
```

Expected: 5 tests pass with zero failures.

- [ ] **Step 6: Commit the route test foundation**

```bash
git add apps/frontend/package.json package-lock.json apps/frontend/vitest.config.ts apps/frontend/src/test/setup.ts apps/frontend/src/appRoute.ts apps/frontend/src/appRoute.test.ts
git commit -m "test: add frontend route test foundation"
```

---

### Task 2: Selectively Copy the Landing Page

**Files:**
- Create: `apps/frontend/src/LandingPage.tsx`
- Create: `apps/frontend/src/LandingPage.css`
- Create: `apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg`
- Test: `apps/frontend/src/LandingPage.test.tsx`

**Interfaces:**
- Consumes: `LandingPageProps.onSelectMaya(): void`, supplied later by `App`.
- Produces: default React component `LandingPage`.
- Produces: an Explore view with a `button` whose accessible name starts with `Call Maya`.
- Produces: a Concierge view with an `a` element whose accessible name starts with `Call Aasrav` and whose `href` is a `tel:` URL.

- [ ] **Step 1: Write failing landing interaction tests**

Create `apps/frontend/src/LandingPage.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("delegates the Maya action to the app router", async () => {
    const user = userEvent.setup();
    const onSelectMaya = vi.fn();

    render(<LandingPage onSelectMaya={onSelectMaya} />);
    await user.click(screen.getByRole("button", { name: /^Call Maya/ }));

    expect(onSelectMaya).toHaveBeenCalledTimes(1);
  });

  it("keeps the Aasrav action as a telephone link", async () => {
    const user = userEvent.setup();

    render(<LandingPage onSelectMaya={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "Concierge" }));

    expect(
      screen.getByRole("link", { name: /^Call Aasrav/ }).getAttribute("href"),
    ).toBe("tel:+910000000000");
  });

  it("synchronizes the selected view with browser history", async () => {
    const user = userEvent.setup();

    render(<LandingPage onSelectMaya={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "Concierge" }));
    window.history.pushState(null, "", "/explore");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(screen.getByRole("button", { name: /^Call Maya/ })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the landing tests and verify they fail**

Run:

```bash
npm test --workspace frontend -- src/LandingPage.test.tsx
```

Expected: FAIL because `./LandingPage` does not exist.

- [ ] **Step 3: Copy the hero image without checking out or merging the branch**

Read the blob from the remote-tracking branch and write that exact blob to the new asset path. Use a temporary file only for the binary transfer, then stage the resulting asset:

```bash
git show origin/feature/landing-page:apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg > apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg
git hash-object apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg
git rev-parse origin/feature/landing-page:apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg
```

Expected: the two object hashes are identical.

- [ ] **Step 4: Create the landing component with Maya navigation isolated behind a prop**

Use `origin/feature/landing-page:apps/frontend/src/App.tsx` as the copy source for its page configuration, phone icon, hero markup, and Explore/Concierge state. Create `apps/frontend/src/LandingPage.tsx` with these exact integration boundaries:

```typescript
import { useCallback, useEffect, useMemo, useState } from "react";
import heroImage from "./assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg";
import "./LandingPage.css";

const FALLBACK_MAYA_PHONE_NUMBER = "+910000000000";
const FALLBACK_AASRAV_PHONE_NUMBER = "+910000000000";

type LandingView = "explore" | "concierge";

interface LandingPageProps {
  onSelectMaya: () => void;
}

type PageConfig = {
  agentName: string;
  ariaLabel: string;
  ctaLabel: string;
  description: string;
  phoneNumber: string;
  titleOutline: string;
  titleSolid: string;
};

function getLandingView(pathname: string): LandingView {
  return pathname === "/concierge" ? "concierge" : "explore";
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectMaya }) => {
  const [activeView, setActiveView] = useState<LandingView>(() =>
    getLandingView(window.location.pathname),
  );

  const pages = useMemo<Record<LandingView, PageConfig>>(
    () => ({
      explore: {
        agentName: "Maya",
        ariaLabel: "Paneer Hospitality vacation explorer",
        ctaLabel: "Call Maya",
        description: "Curated escapes, one call away.",
        phoneNumber:
          import.meta.env.VITE_MAYA_PHONE_NUMBER?.trim() ||
          FALLBACK_MAYA_PHONE_NUMBER,
        titleOutline: "Fingertips",
        titleSolid: "World At Your",
      },
      concierge: {
        agentName: "Aasrav",
        ariaLabel: "Paneer Hospitality hotel concierge",
        ctaLabel: "Call Aasrav",
        description:
          "Airport pickup, late checkout, dining and guest requests.",
        phoneNumber:
          import.meta.env.VITE_AASRAV_PHONE_NUMBER?.trim() ||
          FALLBACK_AASRAV_PHONE_NUMBER,
        titleOutline: "Handled",
        titleSolid: "Every Stay",
      },
    }),
    [],
  );

  const handleViewChange = useCallback((view: LandingView) => {
    const path = view === "explore" ? "/explore" : "/concierge";
    window.history.pushState(null, "", path);
    setActiveView(view);
  }, []);

  const handleExplore = useCallback(() => {
    handleViewChange("explore");
  }, [handleViewChange]);

  const handleConcierge = useCallback(() => {
    handleViewChange("concierge");
  }, [handleViewChange]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getLandingView(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const page = pages[activeView];

  return (
    <main className="landing-page">
      <section
        className={`landing-hero landing-hero-${activeView}`}
        aria-label={page.ariaLabel}
      >
        <img
          className="landing-hero-image"
          src={heroImage}
          alt="A tropical water destination"
        />
        <div className="landing-water-motion" aria-hidden="true" />
        <div className="landing-water-shimmer" aria-hidden="true" />
        <div className="landing-blue-overlay" aria-hidden="true" />

        <nav className="landing-route-switcher" aria-label="AI employees">
          <button
            className={activeView === "explore" ? "active" : undefined}
            type="button"
            onClick={handleExplore}
          >
            Explore
          </button>
          <button
            className={activeView === "concierge" ? "active" : undefined}
            type="button"
            onClick={handleConcierge}
          >
            Concierge
          </button>
        </nav>

        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            <span className="solid-text">{page.titleSolid}</span>
            <span>{page.titleOutline}</span>
          </h1>
          <p className="landing-description">{page.description}</p>

          {activeView === "explore" ? (
            <button
              className="landing-call-button"
              type="button"
              onClick={onSelectMaya}
              aria-label="Call Maya, AI vacation sales specialist"
            >
              <PhoneIcon />
              {page.ctaLabel}
            </button>
          ) : (
            <a
              className="landing-call-button"
              href={`tel:${page.phoneNumber}`}
              aria-label="Call Aasrav, AI hotel concierge"
            >
              <PhoneIcon />
              {page.ctaLabel}
            </a>
          )}
        </div>
      </section>
    </main>
  );
};

const PhoneIcon: React.FC = () => (
  <svg
    className="landing-call-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6.6 3.8 8.9 3c.7-.2 1.5.1 1.8.8l1.1 2.6c.3.6.1 1.3-.4 1.7l-1.5 1.2c.9 1.8 2.4 3.3 4.2 4.2l1.2-1.5c.4-.5 1.1-.7 1.7-.4l2.6 1.1c.7.3 1 1.1.8 1.8l-.8 2.3c-.3.8-1 1.3-1.8 1.3C11.2 18.1 5.9 12.8 5.9 6.2c0-.8.5-1.6 1.3-1.8Z" />
  </svg>
);

export default LandingPage;
```

- [ ] **Step 5: Copy and scope the landing styles**

Read `origin/feature/landing-page:apps/frontend/src/App.css`. Copy its landing declarations from `.landing-page` through the reduced-motion media query into `LandingPage.css`, while applying this complete selector mapping:

```text
.hero                    -> .landing-page .landing-hero
.hero-explore            -> .landing-page .landing-hero-explore
.hero-concierge          -> .landing-page .landing-hero-concierge
.hero-image              -> .landing-page .landing-hero-image
.blue-overlay            -> .landing-page .landing-blue-overlay
.water-motion            -> .landing-page .landing-water-motion
.water-shimmer           -> .landing-page .landing-water-shimmer
.hero-content            -> .landing-page .landing-hero-content
.route-switcher          -> .landing-page .landing-route-switcher
.hero-title              -> .landing-page .landing-hero-title
.description             -> .landing-page .landing-description
.call-button             -> .landing-page .landing-call-button
.call-icon               -> .landing-page .landing-call-icon
background-drift         -> landing-background-drift
wave-flow                -> landing-wave-flow
water-shimmer            -> landing-water-shimmer
```

Start the file with a page-scoped reset instead of copying feature-branch global selectors:

```css
.landing-page {
  min-height: 100vh;
  background: #06171d;
  color: #fff;
  font-family:
    Inter, Arial, Helvetica, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.landing-page,
.landing-page * {
  box-sizing: border-box;
}
```

Do not copy the feature branch's `:root`, `html`, `body`, `#root`, or global `a` rules. Preserve every visual declaration and responsive/reduced-motion rule after applying the mapping.

- [ ] **Step 6: Run the landing tests and verify they pass**

Run:

```bash
npm test --workspace frontend -- src/LandingPage.test.tsx
```

Expected: 3 tests pass with zero failures.

- [ ] **Step 7: Verify the copied asset and selective diff**

Run:

```bash
git diff --name-status
git diff -- apps/frontend/src/LandingPage.tsx apps/frontend/src/LandingPage.css
```

Expected: only the landing component, scoped landing stylesheet, landing test, and hero asset are new in this task; no backend, API, environment, workspace, or root configuration files are modified.

- [ ] **Step 8: Commit the standalone landing page**

```bash
git add apps/frontend/src/LandingPage.tsx apps/frontend/src/LandingPage.css apps/frontend/src/LandingPage.test.tsx apps/frontend/src/assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg
git commit -m "feat: add standalone hospitality landing page"
```

---

### Task 3: Preserve Maya and Connect App Routing

**Files:**
- Create: `apps/frontend/src/VoiceAgentPage.tsx`
- Create: `apps/frontend/src/VoiceAgentPage.css`
- Modify: `apps/frontend/src/App.tsx:1-335`
- Modify: `apps/frontend/src/App.css:1-361`
- Test: `apps/frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: `getAppRoute(pathname: string): AppRoute` from Task 1.
- Consumes: `LandingPageProps.onSelectMaya(): void` from Task 2.
- Produces: default React component `VoiceAgentPage` with the existing `main` ElevenLabs behavior.
- Produces: `App` route controller that renders `LandingPage` or `VoiceAgentPage`.

- [ ] **Step 1: Write failing app navigation tests**

Create `apps/frontend/src/App.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("@elevenlabs/react", () => ({
  ConversationProvider: ({ children }: { children: ReactNode }) => children,
  useConversation: () => ({
    endSession: vi.fn(),
    mode: "listening",
    startSession: vi.fn(),
    status: "disconnected",
  }),
}));

vi.mock("./api", () => ({
  createVoiceSession: vi.fn(),
  getVoiceProviders: vi.fn().mockResolvedValue({ providers: [] }),
}));

describe("App routing", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders the landing page at the root URL", () => {
    render(<App />);

    expect(
      screen.getByRole("region", {
        name: "Paneer Hospitality vacation explorer",
      }),
    ).toBeTruthy();
  });

  it("navigates from Maya to the existing voice console", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /^Call Maya/ }));

    expect(window.location.pathname).toBe("/maya");
    expect(
      screen.getByRole("heading", { name: "Talk to your agent." }),
    ).toBeTruthy();
  });

  it("responds to browser history navigation", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /^Call Maya/ }));
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(
      screen.getByRole("region", {
        name: "Paneer Hospitality vacation explorer",
      }),
    ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the app tests and verify they fail**

Run:

```bash
npm test --workspace frontend -- src/App.test.tsx
```

Expected: FAIL because the current `App` always renders the voice console and `VoiceAgentPage` has not been extracted.

- [ ] **Step 3: Extract the current main voice console without behavior changes**

Create `VoiceAgentPage.tsx` by moving the current `App.tsx` imports, transcript/provider types, initial state, voice-console component body, `StatusBadge`, `Detail`, `requestMicrophonePermission`, and `addTranscriptItem`. Keep all API calls and ElevenLabs callbacks byte-for-byte equivalent. Wrap the existing console so the provider is mounted only on `/maya`:

```typescript
export const VoiceAgentPage: React.FC = () => (
  <ConversationProvider>
    <div className="voice-agent-page">
      <VoiceAgentConsole />
    </div>
  </ConversationProvider>
);

export default VoiceAgentPage;
```

Rename the current inner `VoiceAgentPage` function to `VoiceAgentConsole`; its state, effects, handlers, JSX, and helper functions remain unchanged. Replace the old `./App.css` import with:

```typescript
import "./VoiceAgentPage.css";
```

- [ ] **Step 4: Scope the current voice styles**

Move the current `App.css` voice declarations into `VoiceAgentPage.css`. Apply `.voice-agent-page` to every selector, including selectors inside the mobile media query. Convert current global selectors as follows:

```css
.voice-agent-page {
  min-height: 100vh;
  color: #18201f;
  background: #f5f3ec;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

.voice-agent-page button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.voice-agent-page button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.voice-agent-page h1,
.voice-agent-page h2,
.voice-agent-page p {
  margin: 0;
}
```

Prefix all remaining current selectors, for example `.hero` becomes `.voice-agent-page .hero`, `.status-badge` becomes `.voice-agent-page .status-badge`, and `.transcript-item.system` becomes `.voice-agent-page .transcript-item.system`. This preserves declarations while preventing the shared `.hero` class from colliding with the landing page.

Replace `App.css` with the shared document reset only:

```css
:root {
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}
```

- [ ] **Step 5: Implement the dependency-free app route controller**

Replace `App.tsx` with:

```typescript
import { useCallback, useEffect, useState } from "react";
import { getAppRoute } from "./appRoute";
import LandingPage from "./LandingPage";
import VoiceAgentPage from "./VoiceAgentPage";
import "./App.css";

export const App: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState(() =>
    getAppRoute(window.location.pathname),
  );

  const handleSelectMaya = useCallback(() => {
    window.history.pushState(null, "", "/maya");
    setActiveRoute("maya");
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveRoute(getAppRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return activeRoute === "maya" ? (
    <VoiceAgentPage />
  ) : (
    <LandingPage onSelectMaya={handleSelectMaya} />
  );
};
```

- [ ] **Step 6: Run focused tests and verify they pass**

Run:

```bash
npm test --workspace frontend -- src/appRoute.test.ts src/LandingPage.test.tsx src/App.test.tsx
```

Expected: 11 tests pass with zero failures.

- [ ] **Step 7: Run complete frontend verification**

Run each command from the repository root:

```bash
npm test --workspace frontend
npm run lint --workspace frontend
npm run check-types --workspace frontend
npm run build --workspace frontend
```

Expected: every command exits with status 0; the test output reports zero failures, lint reports zero warnings/errors, TypeScript reports no errors, and Vite produces `apps/frontend/dist`.

- [ ] **Step 8: Commit the integrated routes and preserved voice console**

```bash
git add apps/frontend/src/App.tsx apps/frontend/src/App.css apps/frontend/src/App.test.tsx apps/frontend/src/VoiceAgentPage.tsx apps/frontend/src/VoiceAgentPage.css
git commit -m "feat: route Maya landing action to voice console"
```

---

### Task 4: Browser Verification and Scope Audit

**Files:**
- Verify only; no source files are created or modified.

**Interfaces:**
- Consumes: complete frontend from Tasks 1-3.
- Produces: verification evidence for landing rendering, Maya navigation, and branch-copy scope.

- [ ] **Step 1: Start both required development services**

Run from the repository root in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Expected: backend listens on its configured local port and Vite reports `http://127.0.0.1:5173/`.

- [ ] **Step 2: Verify the landing and Maya flow in a browser**

Open `http://127.0.0.1:5173/` and verify:

```text
1. The tropical landing hero fills the viewport at `/`.
2. Explore shows Maya and Concierge shows Aasrav.
3. Returning to Explore and selecting Call Maya changes the URL to `/maya`.
4. `/maya` shows the existing vendor, session, details, and transcript panels.
5. Browser Back returns to the landing page with the correct landing view.
6. A mobile-width viewport keeps the landing CTA and voice controls usable.
```

- [ ] **Step 3: Audit the Git diff against the selective-copy constraint**

Run:

```bash
git diff origin/main...HEAD --name-status
git diff origin/main...HEAD -- apps/backend apps/frontend/src/api.ts .env.example turbo.json package.json
```

Expected: the first command lists only the design/plan documents and frontend files named in this plan. The second command is empty, proving that backend code, the API client, root environment configuration, Turbo configuration, and root package configuration were not copied from the feature branch.

- [ ] **Step 4: Record final verification state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -5
```

Expected: `main` has a clean working tree and contains the documentation, test foundation, standalone landing page, and route integration commits.
