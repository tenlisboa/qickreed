export default function SettingsPage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your application preferences and configurations
        </p>
      </div>

      <div className="space-y-8">
        {/* Notifications */}
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-black mb-6">
              Notifications
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="checkbox border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    Document Updates
                  </p>
                  <p className="text-xs text-gray-500">
                    Get notified when documents are modified
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="checkbox border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    Team Activity
                  </p>
                  <p className="text-xs text-gray-500">
                    Notifications about team member actions
                  </p>
                </div>
                <input type="checkbox" className="checkbox border-gray-300" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    Weekly Reports
                  </p>
                  <p className="text-xs text-gray-500">
                    Receive weekly activity summaries
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="checkbox border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-black mb-6">Appearance</h3>

            <div className="space-y-6">
              <div>
                <label className="label">
                  <span className="label-text text-black font-medium">
                    Theme
                  </span>
                </label>
                <select className="select select-bordered w-full max-w-xs bg-white border-gray-300 text-black focus:border-black focus:ring-0">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-black font-medium">
                    Language
                  </span>
                </label>
                <select className="select select-bordered w-full max-w-xs bg-white border-gray-300 text-black focus:border-black focus:ring-0">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-black font-medium">
                    Timezone
                  </span>
                </label>
                <select className="select select-bordered w-full max-w-xs bg-white border-gray-300 text-black focus:border-black focus:ring-0">
                  <option>UTC-8 (Pacific)</option>
                  <option>UTC-5 (Eastern)</option>
                  <option>UTC+0 (London)</option>
                  <option>UTC+1 (Paris)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-black mb-6">Privacy</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    Profile Visibility
                  </p>
                  <p className="text-xs text-gray-500">
                    Make your profile visible to team members
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="checkbox border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    Activity Status
                  </p>
                  <p className="text-xs text-gray-500">
                    Show when you're online
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="checkbox border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Analytics</p>
                  <p className="text-xs text-gray-500">
                    Help improve our service with usage data
                  </p>
                </div>
                <input type="checkbox" className="checkbox border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card bg-white border border-red-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-red-600 mb-6">
              Danger Zone
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Export Data</p>
                  <p className="text-xs text-gray-500">
                    Download all your data in JSON format
                  </p>
                </div>
                <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
                  Export
                </button>
              </div>

              <div className="divider"></div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Delete Account
                  </p>
                  <p className="text-xs text-gray-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button className="btn bg-red-600 hover:bg-red-700 text-white border-none transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="btn bg-black hover:bg-gray-800 text-white border-none transition-colors">
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
