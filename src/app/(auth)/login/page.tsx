"use client";

import Link from "next/link";
import { useActionState } from "react";
import Card from "@/components/Card";
import SubmitButton from "@/components/SubmitButton";
import { Alert } from "@/components/ui/alert";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">QickReed</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form Card */}
        <Card shadow="md" padding="lg">
          <form action={formAction} className="space-y-6">
            {/* Inline error */}
            {state?.error ? (
              <Alert variant="error">{state.error.message}</Alert>
            ) : null}

            {/* Email Input */}
            <FormControl>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="w-full"
                placeholder="Enter your email"
              />
            </FormControl>

            {/* Password Input */}
            <FormControl>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="w-full"
                placeholder="Enter your password"
              />
            </FormControl>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-black transition-colors focus-brutal"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <SubmitButton
              variant="primary"
              className="w-full"
              pendingLabel="Entrando…"
            >
              Sign In
            </SubmitButton>
          </form>

          {/* Divider */}
          <Divider label="or" />

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-black font-medium hover:underline focus-brutal"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 QickReed. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
