import Button from "@/components/Button";
import Card from "@/components/Card";

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
        <Card>
          <h3 className="text-xl font-medium text-black mb-2">
            Total Documents
          </h3>
          <p className="text-3xl font-bold text-black">247</p>
          <p className="text-sm text-gray-600 mt-1">+12% from last month</p>
        </Card>

        <Card>
          <h3 className="text-xl font-medium text-black mb-2">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-black">8</p>
          <p className="text-sm text-gray-600 mt-1">2 due this week</p>
        </Card>

        <Card>
          <h3 className="text-xl font-medium text-black mb-2">Team Members</h3>
          <p className="text-3xl font-bold text-black">12</p>
          <p className="text-sm text-gray-600 mt-1">3 online now</p>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Recent Activity
        </h2>
        <Card>
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
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Create Document</Button>
          <Button variant="secondary">Invite Team Member</Button>
          <Button variant="secondary">View Reports</Button>
        </div>
      </div>
    </div>
  );
}
