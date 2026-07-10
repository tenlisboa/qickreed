import Link from "next/link";
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
                  placeholder="Enter your password"
                />
              </div>

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
              <button
                type="submit"
                formAction={login}
                className="btn btn-block bg-black hover:bg-gray-800 text-white border-none transition-colors"
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <div className="divider text-gray-400">or</div>

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
