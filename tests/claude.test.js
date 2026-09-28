// @vitest-environment node
import { createRequire } from "node:module";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
const require = createRequire(import.meta.url);
const handler = require("../api/ai.js");
const body = { system: "Suggest dinner", messages: [{ role: "user", content: "Chicken" }], max_tokens: 999999, model: "caller-model" };
const reply = () => ({ setHeader: vi.fn(), status: vi.fn(function (code) { this.code = code; return this; }), json: vi.fn(function (body) { this.body = body; return this; }) });
beforeEach(() => {
  vi.stubEnv("NIGHTFUEL_ALLOWED_EMAIL", "owner@example.com");
  vi.stubEnv("OPENAI_API_KEY", "test-key"); vi.stubEnv("SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("SUPABASE_ANON_KEY", "public-key"); vi.stubEnv("OPENAI_MODEL", "server-model");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ id: crypto.randomUUID(), email: "owner@example.com" }) }).mockResolvedValue({ ok: true, json: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Dinner" }] }] }) }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("rejects unauthenticated calls before contacting OpenAI", async () => {
  const res = reply(); await handler({ method: "POST", body, headers: {} }, res);
  expect(res.code).toBe(401); expect(fetch).not.toHaveBeenCalled();
});
it("fails closed if the personal account setting is missing", async () => {
  vi.stubEnv("NIGHTFUEL_ALLOWED_EMAIL", "");
  const res = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer session" } }, res);
  expect(res.code).toBe(503); expect(fetch).not.toHaveBeenCalled();
});
it("verifies the session and enforces the server model and token cap", async () => {
  const res = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer session" } }, res);
  expect(res.code).toBe(200);
  expect(fetch.mock.calls[0][0]).toBe("https://example.supabase.co/auth/v1/user");
  const forwarded = JSON.parse(fetch.mock.calls[1][1].body);
  expect(forwarded.model).toBe("server-model"); expect(forwarded.max_output_tokens).toBe(8000);
  expect(forwarded.store).toBe(false); expect(forwarded.instructions).toBe(body.system);
  expect(forwarded.input).toEqual(body.messages); expect(res.body).toEqual({ text: "Dinner" });
  expect(fetch.mock.calls[1][0]).toBe("https://api.openai.com/v1/responses");
  expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer test-key");
});
it("rejects an invalid session and an account outside the allowlist", async () => {
  fetch.mockReset().mockResolvedValue({ ok: false, status: 401 });
  const first = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer invalid" } }, first);
  expect(first.code).toBe(401); expect(fetch).toHaveBeenCalledTimes(1);
  vi.stubEnv("NIGHTFUEL_ALLOWED_EMAIL", "owner@example.com");
  fetch.mockReset().mockResolvedValue({ ok: true, json: async () => ({ id: "other", email: "other@example.com" }) });
  const second = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer other" } }, second);
  expect(second.code).toBe(403); expect(fetch).toHaveBeenCalledTimes(1);
});
it("rejects oversized and malformed payloads", async () => {
  for (const invalid of [{ ...body, messages: [] }, { ...body, messages: [{ role: "user", content: "a".repeat(90_000) }] }]) {
    const res = reply(); await handler({ method: "POST", body: invalid, headers: { authorization: "Bearer session" } }, res); expect(res.code).toBe(400);
  }
  expect(fetch).not.toHaveBeenCalled();
});
it("throttles repeated calls on the same instance", async () => {
  fetch.mockReset().mockImplementation(async url => ({ ok: true, json: async () => url.includes("/auth/") ? { id: "rate-test", email: "owner@example.com" } : { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Dinner" }] }] } }));
  for (let n = 0; n < 12; n++) { const res = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer session" } }, res); expect(res.code).toBe(200); }
  const res = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer session" } }, res);
  expect(res.code).toBe(429); expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
});
it("rejects incomplete OpenAI output instead of returning partial recipes", async () => {
  fetch.mockReset().mockResolvedValueOnce({ ok: true, json: async () => ({ id: "truncated", email: "owner@example.com" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] }) });
  const res = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer session" } }, res);
  expect(res.code).toBe(502); expect(res.body.error).toContain("cut short");
});
it("provides an actionable error for an OpenAI key with no API credits", async () => {
  fetch.mockReset().mockResolvedValueOnce({ ok: true, json: async () => ({ id: "quota", email: "owner@example.com" }) })
    .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: { code: "insufficient_quota" } }) });
  const res = reply(); await handler({ method: "POST", body, headers: { authorization: "Bearer session" } }, res);
  expect(res.code).toBe(502); expect(res.body.error).toContain("credits");
});
