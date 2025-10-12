import Sidebar from "@/components/Sidebar";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar className="h-screen sticky top-0" />

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
