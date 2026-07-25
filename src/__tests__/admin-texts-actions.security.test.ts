import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    set: () => {},
  }),
}));

import { revalidatePath } from "next/cache";
import {
  createText,
  deleteText,
  getTextById,
  getTexts,
  updateText,
} from "@/app/(authenticated)/admin/texts/actions";
import { createClient } from "@/utils/supabase/server";

type Chain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  _singleResult?: { data?: unknown; error?: unknown };
  _maybeSingleResult?: { data?: unknown; error?: unknown };
  _rangeResult?: { data?: unknown; error?: unknown; count?: number };
  _limitResult?: { data?: unknown; error?: unknown };
  _terminalResult?: { data?: unknown; error?: unknown; count?: number };
};

function makeFakeSupabase() {
  const chains: Record<string, Chain> = {};
  const ensure = (table: string): Chain => {
    if (chains[table]) return chains[table];
    const chain: Chain = {} as Chain;
    const executable = {
      eq: vi.fn(() =>
        Promise.resolve(chain._terminalResult ?? { data: null, error: null }),
      ),
    };
    chain.select = vi.fn(() => chain);
    chain.insert = vi.fn(() => chain);
    chain.update = vi.fn(() => executable);
    chain.delete = vi.fn(() => executable);
    chain.eq = vi.fn(() => chain);
    chain.ilike = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.range = vi.fn(() =>
      Promise.resolve(
        chain._rangeResult ?? { data: [], error: null, count: 0 },
      ),
    );
    chain.limit = vi.fn(() =>
      Promise.resolve(chain._limitResult ?? { data: [], error: null }),
    );
    chain.single = vi.fn(() =>
      Promise.resolve(chain._singleResult ?? { data: null, error: null }),
    );
    chain.maybeSingle = vi.fn(() =>
      Promise.resolve(chain._maybeSingleResult ?? { data: null, error: null }),
    );
    chains[table] = chain;
    return chain;
  };
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "u-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ensure(table)),
  };
  return { client, chains };
}

let supabaseClient: ReturnType<typeof makeFakeSupabase>["client"];
let chains: ReturnType<typeof makeFakeSupabase>["chains"];

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
  const fake = makeFakeSupabase();
  supabaseClient = fake.client;
  chains = fake.chains;
  for (const t of [
    "profiles",
    "text",
    "diagnostic_session",
    "training_session",
  ]) {
    supabaseClient.from(t);
  }
  vi.mocked(createClient).mockResolvedValue(supabaseClient);
});

function setAdmin() {
  supabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: "u-admin" } },
    error: null,
  });
  chains.profiles._singleResult = { data: { role: "admin" }, error: null };
}

function setMember() {
  supabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: "u-member" } },
    error: null,
  });
  chains.profiles._singleResult = { data: { role: "member" }, error: null };
}

const sampleText = {
  id: "t-1",
  title: "Título",
  content: "Conteúdo",
  type: "diagnostic",
  language: "pt-BR",
  num_words: 100,
  quiz_json: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("admin text actions — auth defense (D-10)", () => {
  describe("createText", () => {
    it("non-admin: action rejects with NEXT_REDIRECT and no text insert / revalidatePath call", async () => {
      setMember();
      const data = {
        title: "T",
        content: "C",
        type: "diagnostic" as const,
        language: "pt-BR",
        num_words: 10,
        quiz_json: null,
      };
      await expect(createText(data)).rejects.toThrow();
      expect(chains.text.insert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("admin: ok({ id }) emitted with revalidatePath called", async () => {
      setAdmin();
      chains.text._singleResult = { data: sampleText, error: null };
      const data = {
        title: "T",
        content: "C",
        type: "diagnostic" as const,
        language: "pt-BR",
        num_words: 10,
        quiz_json: null,
      };
      const result = await createText(data);
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ id: "t-1" });
      expect(chains.text.insert).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('Supabase insert error: fail("db_error") returned', async () => {
      setAdmin();
      const err = { message: "insert failed", code: "23505" };
      chains.text._singleResult = { data: null, error: err };
      const data = {
        title: "T",
        content: "C",
        type: "diagnostic" as const,
        language: "pt-BR",
        num_words: 10,
        quiz_json: null,
      };
      const result = await createText(data);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("db_error");
      expect(result.error?.message).toBeTruthy();
      expect(result.error?.details).toBe(err);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("updateText", () => {
    const updateData = {
      title: "T",
      content: "C",
      type: "diagnostic" as const,
      language: "pt-BR",
      num_words: 10,
      quiz_json: null,
    };

    it("non-admin: action rejects + no text update / revalidatePath call", async () => {
      setMember();
      await expect(updateText("t-1", updateData)).rejects.toThrow();
      expect(chains.text.update).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("admin: ok(null) with revalidatePath called", async () => {
      setAdmin();
      chains.text._terminalResult = { data: null, error: null };
      const result = await updateText("t-1", updateData);
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
      expect(chains.text.update).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('Supabase update error: fail("db_error") returned', async () => {
      setAdmin();
      const err = { message: "update failed" };
      chains.text._terminalResult = { data: null, error: err };
      const result = await updateText("t-1", updateData);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("db_error");
      expect(result.error?.details).toBe(err);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("deleteText", () => {
    it("non-admin: action rejects + no text delete / revalidatePath call", async () => {
      setMember();
      await expect(deleteText("t-1")).rejects.toThrow();
      expect(chains.text.delete).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('admin + checkTextInUse=true: fail("validation") with pt-BR message', async () => {
      setAdmin();
      chains.diagnostic_session._limitResult = {
        data: [{ id: "s-1" }],
        error: null,
      };
      const result = await deleteText("t-1");
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toContain("não pode ser deletado");
      expect(chains.text.delete).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("admin + checkTextInUse=false + success: ok(null) + revalidatePath called", async () => {
      setAdmin();
      chains.diagnostic_session._limitResult = { data: [], error: null };
      chains.training_session._limitResult = { data: [], error: null };
      chains.text._terminalResult = { data: null, error: null };
      const result = await deleteText("t-1");
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
      expect(chains.text.delete).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('Supabase delete error: fail("db_error") returned', async () => {
      setAdmin();
      chains.diagnostic_session._limitResult = { data: [], error: null };
      chains.training_session._limitResult = { data: [], error: null };
      const err = { message: "delete failed" };
      chains.text._terminalResult = { data: null, error: err };
      const result = await deleteText("t-1");
      expect(result.error?.code).toBe("db_error");
      expect(result.error?.details).toBe(err);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("getTexts", () => {
    it("non-admin: action rejects + no text select observed", async () => {
      setMember();
      await expect(
        getTexts({ page: 1, search: "", sort: "created_at", order: "desc" }),
      ).rejects.toThrow();
      expect(chains.text.select).not.toHaveBeenCalled();
    });

    it("admin: ok(TextListResult) returned", async () => {
      setAdmin();
      chains.text._rangeResult = {
        data: [sampleText],
        error: null,
        count: 1,
      };
      const result = await getTexts();
      expect(result.error).toBeNull();
      expect(result.data?.texts).toHaveLength(1);
      expect(result.data?.totalCount).toBe(1);
      expect(result.data?.currentPage).toBe(1);
      expect(chains.text.select).toHaveBeenCalled();
    });

    it('Supabase select error: fail("db_error") returned', async () => {
      setAdmin();
      const err = { message: "select failed" };
      chains.text._rangeResult = { data: null, error: err, count: 0 };
      const result = await getTexts();
      expect(result.error?.code).toBe("db_error");
      expect(result.error?.details).toBe(err);
    });
  });

  describe("getTextById", () => {
    it("regression: getTextById has NO await checkAdminAccess() — documented deliberate open read per D-04", async () => {
      setMember();
      chains.text._maybeSingleResult = { data: sampleText, error: null };
      const result = await getTextById("t-1");
      expect(result.error).toBeNull();
      expect(result.data).toEqual(sampleText);
      expect(chains.profiles.select).not.toHaveBeenCalled();
    });

    it("missing row: ok(null) returned (no not_found)", async () => {
      chains.text._maybeSingleResult = { data: null, error: null };
      const result = await getTextById("t-missing");
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('Supabase error: fail("db_error") returned', async () => {
      const err = { message: "select failed", code: "PGRST101" };
      chains.text._maybeSingleResult = { data: null, error: err };
      const result = await getTextById("t-1");
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("db_error");
      expect(result.error?.message).toBeTruthy();
      expect(result.error?.details).toBe(err);
    });
  });
});
