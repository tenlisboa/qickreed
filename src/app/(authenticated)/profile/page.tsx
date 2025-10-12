export default function ProfilePage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1">
          <div className="card bg-white border border-gray-200 shadow-lg">
            <div className="card-body p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-600 text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-medium text-black mb-1">John Doe</h3>
              <p className="text-gray-600 mb-4">Product Manager</p>
              <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors w-full">
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card bg-white border border-gray-200 shadow-lg">
            <div className="card-body p-6">
              <h3 className="text-xl font-medium text-black mb-6">
                Personal Information
              </h3>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label" htmlFor="firstName">
                      <span className="label-text text-black font-medium">
                        First Name
                      </span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      defaultValue="John"
                      className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="lastName">
                      <span className="label-text text-black font-medium">
                        Last Name
                      </span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      defaultValue="Doe"
                      className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                    />
                  </div>
                </div>

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
                    defaultValue="john.doe@example.com"
                    className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="jobTitle">
                    <span className="label-text text-black font-medium">
                      Job Title
                    </span>
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    defaultValue="Product Manager"
                    className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="bio">
                    <span className="label-text text-black font-medium">
                      Bio
                    </span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="textarea textarea-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn bg-black hover:bg-gray-800 text-white border-none transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security Section */}
          <div className="card bg-white border border-gray-200 shadow-lg mt-6">
            <div className="card-body p-6">
              <h3 className="text-xl font-medium text-black mb-6">Security</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">Password</p>
                    <p className="text-xs text-gray-500">
                      Last updated 3 months ago
                    </p>
                  </div>
                  <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
                    Change Password
                  </button>
                </div>

                <div className="divider"></div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-gray-500">
                      Add an extra layer of security
                    </p>
                  </div>
                  <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
