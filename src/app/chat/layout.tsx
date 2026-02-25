import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden bg-neutral-950">
                <AppSidebar />
                <main className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">
                    {/* Mobile header with sidebar trigger */}
                    <div className="md:hidden flex items-center p-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10 w-full">
                        <SidebarTrigger className="text-neutral-400 hover:text-white" />
                        <span className="ml-3 font-semibold text-white">AI Workspace</span>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
