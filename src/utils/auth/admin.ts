"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";

export async function checkAdminAccess(): Promise<{
  user: any;
  role: UserRole;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get user role from profiles table
  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || !profile) {
    console.error("Error fetching user role:", roleError);
    redirect("/dashboard");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, role: profile.role };
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || !profile) {
    return null;
  }

  return profile.role;
}
