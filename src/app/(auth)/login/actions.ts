"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/utils/actions/types";
import { fail } from "@/utils/actions/types";
import { mapAuthError } from "@/utils/auth/errors";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";

export async function login(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    const log = await getRequestLogger({ module: "login" });
    log.warn({ err: error, email: data.email }, "Login failed");
    const { code, message, details } = mapAuthError(error, "login");
    return fail(code, message, details);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;
  const terms = formData.get("terms");

  if (!email || !password) {
    return fail("validation", "Email and password are required");
  }

  if (password !== confirmPassword) {
    return fail("validation", "Passwords do not match");
  }

  if (terms !== "true") {
    return fail(
      "validation",
      "You must accept the Terms of Service and Privacy Policy",
    );
  }

  const supabase = await createClient();

  const data = { email, password };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    const log = await getRequestLogger({ module: "signup" });
    log.warn({ err: error, email: data.email }, "Signup failed");
    const { code, message, details } = mapAuthError(error, "signup");
    return fail(code, message, details);
  }

  // Email confirmation is disabled in this project (supabase/config.toml),
  // so sign in immediately after signup to establish the session.
  const { error: signInError } = await supabase.auth.signInWithPassword(data);

  if (signInError) {
    const log = await getRequestLogger({ module: "signup" });
    log.warn(
      { err: signInError, email: data.email },
      "Post-signup login failed",
    );
    redirect("/login");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
