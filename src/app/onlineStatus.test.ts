import { describe, expect, it } from "vitest";
import { isOnlineByDefault } from "./onlineStatus";

describe("isOnlineByDefault", () => {
  it("treats explicit true as online", () => {
    expect(isOnlineByDefault(true)).toBe(true);
  });

  it("treats explicit false as offline", () => {
    expect(isOnlineByDefault(false)).toBe(false);
  });

  it("treats undefined (Node's partial navigator stub, or any environment lacking the property) as online, not offline", () => {
    // This is the exact regression: Node 21+'s global `navigator` object
    // has no `onLine` property at all, so this is `undefined`, not
    // `false` -- a naive truthiness check treats that as offline, which
    // made the banner show incorrectly on every server-rendered page.
    expect(isOnlineByDefault(undefined)).toBe(true);
  });
});
