import { afterEach, describe, expect, it, vi } from "vitest";
import { inviteInitialAdministrator } from "./platform-api";

describe("platform API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends only fields accepted by the invitation endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "invitation-id" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await inviteInitialAdministrator("business-id", {
      businessId: "business-id",
      email: "admin@tienda.test",
      displayName: "Administrador",
    } as { businessId: string; email: string; displayName: string });

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request?.body as string)).toEqual({
      email: "admin@tienda.test",
      displayName: "Administrador",
      role: "ADMIN",
      maxDiscountPercent: 100,
    });
  });
});
