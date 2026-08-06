import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { defaultAgentConfig, vendorCatalog } from "@/lib/agent-config";

describe("voice agent console", () => {
  it("renders editable config, transcript, and exact key panels", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/catalog")) {
        return Response.json({ vendors: vendorCatalog, credentialProfiles: [] });
      }
      if (url.endsWith("/api/configs")) {
        return Response.json({ configs: [defaultAgentConfig], config: defaultAgentConfig });
      }
      if (url.endsWith("/api/sessions")) {
        return Response.json({
          session: { id: "session-1", roomName: "room-1", activeConfig: defaultAgentConfig, createdAt: new Date().toISOString() },
          livekit: { ok: false, missing: ["LIVEKIT_URL"] },
          demoMode: true,
        });
      }
      return Response.json({});
    }));

    render(<Home />);

    expect(screen.getByText("Editable Agent Configuration")).toBeInTheDocument();
    expect(screen.getByText("Conversation + Live Transcript")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Start Agent" }).length).toBeGreaterThanOrEqual(1);
    await waitFor(() => expect(screen.getAllByText("providers.llm.temperature").length).toBeGreaterThanOrEqual(1));
  });

  it("lets the user edit the system prompt", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/catalog")) {
        return Response.json({ vendors: vendorCatalog, credentialProfiles: [] });
      }
      if (url.endsWith("/api/configs")) {
        return Response.json({ configs: [defaultAgentConfig] });
      }
      return Response.json({});
    }));

    render(<Home />);

    const prompt = screen.getByRole("textbox", { name: "system prompt" });
    fireEvent.change(prompt, { target: { value: "You are a custom agent." } });

    expect(prompt).toHaveValue("You are a custom agent.");
  });

  it("loads APIs from the standalone LiveKit origin", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/catalog") {
        return Response.json({ vendors: vendorCatalog, credentialProfiles: [] });
      }
      if (url === "/api/configs") {
        return Response.json({ configs: [defaultAgentConfig] });
      }
      return Response.json({});
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/catalog");
      expect(fetchMock).toHaveBeenCalledWith("/api/configs");
    });
  });
});
