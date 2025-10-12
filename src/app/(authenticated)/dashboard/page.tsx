export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to QickReed</p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-black mb-2">
              Total Documents
            </h3>
            <p className="text-3xl font-bold text-black">247</p>
            <p className="text-sm text-gray-600 mt-1">+12% from last month</p>
          </div>
        </div>

        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-black mb-2">
              Active Projects
            </h3>
            <p className="text-3xl font-bold text-black">8</p>
            <p className="text-sm text-gray-600 mt-1">2 due this week</p>
          </div>
        </div>

        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <h3 className="text-xl font-medium text-black mb-2">
              Team Members
            </h3>
            <p className="text-3xl font-bold text-black">12</p>
            <p className="text-sm text-gray-600 mt-1">3 online now</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Recent Activity
        </h2>
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-black">
                    Document "Project Proposal" was updated
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <span className="text-sm text-gray-600">📄</span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-black">
                    New team member added to project
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
                <span className="text-sm text-gray-600">👤</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    System backup completed successfully
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <span className="text-sm text-gray-600">✅</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn bg-black hover:bg-gray-800 text-white border-none transition-colors">
            Create Document
          </button>
          <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            Invite Team Member
          </button>
          <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
