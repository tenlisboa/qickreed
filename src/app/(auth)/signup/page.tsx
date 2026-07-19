"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/(auth)/login/actions";
import Card from "@/components/Card";
import SubmitButton from "@/components/SubmitButton";
import { Alert } from "@/components/ui/alert";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, null);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">QickReed</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {/* Signup Form Card */}
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
                placeholder="Create a password"
              />
            </FormControl>

            {/* Confirm Password Input */}
            <FormControl>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full"
                placeholder="Confirm your password"
              />
            </FormControl>

            {/* Terms and Conditions */}
            <FormControl>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  value="true"
                  required
                  className="h-5 w-5 shrink-0 cursor-pointer appearance-none border-[3px] border-black bg-white transition-brutal focus-brutal checked:bg-black mt-0.5"
                />
                <span className="text-sm text-black/70 font-medium">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-black hover:underline focus-brutal"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-black hover:underline focus-brutal"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </FormControl>

            {/* Signup Button */}
            <SubmitButton
              variant="primary"
              className="w-full"
              pendingLabel="Criando conta…"
            >
              Create Account
            </SubmitButton>
          </form>

          {/* Divider */}
          <Divider label="or" />

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-black font-medium hover:underline focus-brutal"
              >
                Sign in
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
