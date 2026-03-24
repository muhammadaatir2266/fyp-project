import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-muted/40">
      <div className="hidden md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 sticky top-0">
          <Sidebar />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="md:hidden p-4 pb-0">
          <MobileNav />
        </div>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
