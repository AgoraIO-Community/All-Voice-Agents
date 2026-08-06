# LiveKit Provider

This root is reserved for the independent LiveKit voice-agent stack.

## Route contract

The implemented frontend will own `/livekit` and `/livekit/*`. Until then, the portal serves the `/livekit` placeholder.

## Integration contract

- The folder may contain its own frontend, backend, packages, environment examples, and deployment configuration.
- The frontend may use Next.js, Vite, or another Vercel-supported framework.
- Provider secrets must remain in the backend or deployment environment and must not enter a browser bundle.
- Cross-provider navigation must use document links to `/`, `/11labs`, `/livekit`, `/vapi`, and `/agora`.
- When the application is ready, add its workspace package and Vercel project to `portal/microfrontends.json`, then claim `/livekit` and `/livekit/:path*`.

Do not register the route in Microfrontends until both the base path and nested-path fallback render successfully.
