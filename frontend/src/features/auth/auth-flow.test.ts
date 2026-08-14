import { beforeEach, describe, expect, it } from "vitest";
import {
  authFlowTypeFromUrl,
  openPasswordSetup,
  requiresPasswordSetup,
} from "./auth-flow";

describe("auth flow", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("detects invitation links", () => {
    window.history.replaceState({}, "", "/#type=invite");

    expect(authFlowTypeFromUrl()).toBe("invite");
    expect(requiresPasswordSetup("SIGNED_IN", "invite")).toBe(true);
  });

  it("detects password recovery events", () => {
    expect(requiresPasswordSetup("PASSWORD_RECOVERY", null)).toBe(true);
  });

  it("opens the password setup route", () => {
    openPasswordSetup();

    expect(window.location.pathname).toBe("/accept-invitation");
  });
});
