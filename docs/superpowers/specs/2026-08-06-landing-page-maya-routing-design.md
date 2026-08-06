# Landing Page and Maya Routing Design

## Goal

Add the visual landing page from `origin/feature/landing-page` to `main` without merging the feature branch or replacing the existing voice-agent application. The landing page will be the public entry point at `/`, and selecting Maya will open the current `main` voice-agent experience at `/maya`.

## Constraints

- Do not merge `origin/feature/landing-page` into `main`.
- Preserve the backend, ElevenLabs integration, API client, environment configuration, workspace configuration, and package dependencies from `main`.
- Copy only the landing-page UI code, its required styles, and its hero image.
- Keep the Concierge/Aasrav behavior from the landing-page UI.
- Do not add a routing dependency for two routes.

## Architecture

`App` will act as a small route controller based on `window.location.pathname`:

- `/` renders `LandingPage`.
- `/maya` renders the existing `VoiceAgentPage` from `main`.
- Unknown paths fall back to the landing page.

Navigation to Maya will use the browser History API and update React state without a full reload. A `popstate` listener will keep browser back and forward navigation synchronized with the rendered page.

The landing page and voice-agent experience will be separate components. Their CSS selectors will be scoped to distinct page roots so the landing-page styles cannot alter the existing voice console.

## Landing Page Behavior

The landing page will retain the visual treatment, hero image, Explore/Concierge switcher, content, and Aasrav call behavior from `origin/feature/landing-page`.

The Maya call-to-action will change from a `tel:` link to an in-app navigation control. Activating it will navigate to `/maya` and render the existing voice-agent console, where the user can start an ElevenLabs session through the current backend flow.

## Preserved Main-Branch Behavior

The existing Maya voice console will retain:

- provider loading and availability state;
- microphone permission handling;
- signed voice-session creation;
- call start and end controls;
- connection status and session details;
- live transcript handling; and
- existing error messages and recovery controls.

No backend or API behavior will be copied from the landing-page branch.

## Files and Data Flow

The implementation will:

1. Copy the landing hero image into the `main` frontend assets.
2. Extract the landing UI into a focused `LandingPage` component.
3. Keep the existing voice experience in a focused `VoiceAgentPage` component.
4. Update `App` to select the component for the current path and provide the Maya navigation callback.
5. Scope or split styles so each page owns its presentation.

The only cross-component interface is `LandingPage.onSelectMaya(): void`. The landing page does not know how the voice session works; it only requests navigation.

## Error Handling

- Unknown URLs render the landing page rather than a blank screen.
- Existing voice-session and microphone errors remain unchanged.
- Missing backend connectivity is handled by the current provider-loading error state.
- The Concierge/Aasrav telephone link retains its configured fallback number behavior.

## Testing and Verification

Automated tests will cover:

- `/` renders the landing page;
- the Maya action changes the URL to `/maya` and renders the voice console;
- browser history navigation restores the correct page; and
- the Concierge/Aasrav action remains a telephone link.

Verification will also run the frontend test suite, lint, type-check, and production build. A browser check will confirm the landing page renders correctly and the Maya transition reaches the existing voice console.

## Out of Scope

- Merging or rebasing either branch.
- Redesigning the landing page or voice console.
- Changing the backend voice implementation.
- Adding a third-party router.
- Changing deployment or environment-variable configuration.
