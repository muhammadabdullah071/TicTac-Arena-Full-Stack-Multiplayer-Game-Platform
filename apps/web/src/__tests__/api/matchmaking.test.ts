import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/app/api/utils/sql", () => ({
  default: vi.fn(),
}));

describe("Matchmaking API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    const { auth } = await import("@/auth");
    (auth as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/matchmaking/route");
    const request = new Request("http://localhost/api/matchmaking", {
      method: "POST",
      body: JSON.stringify({ action: "join", mode: "casual" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
