import { checkAdminAccess } from "@/utils/auth/admin";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify admin access - will redirect if not admin
  await checkAdminAccess();

  return (
    <div className="min-h-screen bg-white flex">
      <main className="flex-1 bg-gray-50">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
