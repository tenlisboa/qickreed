"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Text, TextType } from "@/types/database";

export interface TextListParams {
  page?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface TextListResult {
  texts: Text[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getTexts({
  page = 1,
  search = "",
  sort = "created_at",
  order = "desc",
}: TextListParams = {}): Promise<TextListResult> {
  const supabase = await createClient();
  const limit = 10;
  const offset = (page - 1) * limit;

  let query = supabase.from("text").select("*", { count: "exact" });

  // Apply search filter
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === "asc" });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching texts:", error);
    throw new Error("Erro ao buscar textos");
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    texts: data || [],
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getTextById(id: string): Promise<Text | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching text:", error);
    return null;
  }

  return data;
}

export async function deleteText(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if text is being used in sessions
  const isInUse = await checkTextInUse(id);
  if (isInUse) {
    return {
      success: false,
      error:
        "Este texto não pode ser deletado pois está sendo usado em sessões de avaliação.",
    };
  }

  const { error } = await supabase.from("text").delete().eq("id", id);

  if (error) {
    console.error("Error deleting text:", error);
    return {
      success: false,
      error: "Erro ao deletar texto",
    };
  }

  revalidatePath("/admin/texts");
  return { success: true };
}

export async function checkTextInUse(id: string): Promise<boolean> {
  const supabase = await createClient();

  // Check diagnostic sessions
  const { data: diagnosticSessions } = await supabase
    .from("diagnostic_session")
    .select("id")
    .eq("text_id", id)
    .limit(1);

  if (diagnosticSessions && diagnosticSessions.length > 0) {
    return true;
  }

  // Check training sessions
  const { data: trainingSessions } = await supabase
    .from("training_session")
    .select("id")
    .eq("text_id", id)
    .limit(1);

  return !!(trainingSessions && trainingSessions.length > 0);
}

export interface CreateTextData {
  title: string;
  content: string;
  type: TextType;
  language: string;
  num_words: number;
}

export async function createText(
  data: CreateTextData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();

  const { data: text, error } = await supabase
    .from("text")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Error creating text:", error);
    return {
      success: false,
      error: "Erro ao criar texto",
    };
  }

  revalidatePath("/admin/texts");
  return { success: true, id: text.id };
}

export interface UpdateTextData {
  title: string;
  content: string;
  type: TextType;
  language: string;
  num_words: number;
}

export async function updateText(
  id: string,
  data: UpdateTextData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("text").update(data).eq("id", id);

  if (error) {
    console.error("Error updating text:", error);
    return {
      success: false,
      error: "Erro ao atualizar texto",
    };
  }

  revalidatePath("/admin/texts");
  revalidatePath(`/admin/texts/edit/${id}`);
  return { success: true };
}
