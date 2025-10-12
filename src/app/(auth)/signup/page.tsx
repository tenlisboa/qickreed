import Link from "next/link";
import { signup } from "@/app/(auth)/login/actions";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">QickReed</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {/* Signup Form Card */}
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-8">
            <form className="space-y-6">
              {/* Email Input */}
              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text text-black font-medium">
                    Email
                  </span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div className="form-control">
                <label className="label" htmlFor="password">
                  <span className="label-text text-black font-medium">
                    Password
                  </span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                  placeholder="Create a password"
                />
              </div>

              {/* Confirm Password Input */}
              <div className="form-control">
                <label className="label" htmlFor="confirmPassword">
                  <span className="label-text text-black font-medium">
                    Confirm Password
                  </span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm border-gray-300"
                    required
                  />
                  <span className="label-text text-gray-600 ml-2">
                    I agree to the{" "}
                    <Link href="/terms" className="text-black hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-black hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Signup Button */}
              <button
                formAction={signup}
                className="btn btn-block bg-black hover:bg-gray-800 text-white border-none transition-colors"
              >
                Create Account
              </button>
            </form>

            {/* Divider */}
            <div className="divider text-gray-400">or</div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-black font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

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
