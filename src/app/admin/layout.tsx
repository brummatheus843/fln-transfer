import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-admin-black text-admin-text md:flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
