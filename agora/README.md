# Agora Provider

This root is reserved for the independent Agora voice-agent stack.

## Route contract

The implemented frontend will own `/agora` and `/agora/*`. Until then, the portal serves the `/agora` placeholder.

## Integration contract

- The folder may contain its own frontend, backend, packages, environment examples, and deployment configuration.
- The frontend may use Next.js, Vite, or another Vercel-supported framework.
- Agora App Certificates, REST credentials, and server token-generation secrets must remain server-side.
- Cross-provider navigation must use document links to `/`, `/11labs`, `/livekit`, `/vapi`, and `/agora`.
- When the application is ready, add its workspace package and Vercel project to `portal/microfrontends.json`, then claim `/agora` and `/agora/:path*`.

Do not register the route in Microfrontends until both the base path and nested-path fallback render successfully.
