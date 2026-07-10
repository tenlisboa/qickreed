import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

export default function LoginPage() {
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
          <form className="space-y-6">
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
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              formAction={login}
              variant="primary"
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <Divider label="or" />

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-black font-medium hover:underline"
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
