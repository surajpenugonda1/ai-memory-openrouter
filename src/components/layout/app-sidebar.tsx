"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    MessageSquare,
    PlusCircle,
    Settings,
    LogOut,
    BrainCircuit,
    Loader2
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserControlDialog } from "./user-control-dialog";
import { getConversations } from "@/actions/conversations";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function AppSidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [conversations, setConversations] = useState<Array<{ id: string, title: string, updatedAt: Date | null }>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadConversations() {
            setIsLoading(true);
            const data = await getConversations();
            setConversations(data);
            setIsLoading(false);
        }
        loadConversations();
    }, [pathname]); // Refresh when navigating (e.g. creating a new chat)

    return (
        <Sidebar className="border-r border-neutral-800 bg-neutral-950 text-neutral-200">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <BrainCircuit size={18} />
                    </div>
                    <span className="font-semibold text-white tracking-tight">AI Workspace</span>
                </div>
                <Link href="/chat" passHref>
                    <SidebarMenuButton className="w-full justify-start gap-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors border border-indigo-600/20">
                        <PlusCircle size={16} />
                        <span>New Chat</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                        Recent Chats
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-sm text-neutral-500">
                                    No recent chats
                                </div>
                            ) : (
                                conversations.map((chat) => (
                                    <SidebarMenuItem key={chat.id}>
                                        <Link href={`/chat/${chat.id}`} passHref>
                                            <SidebarMenuButton
                                                isActive={pathname === `/chat/${chat.id}`}
                                                className="w-full justify-start truncate hover:bg-neutral-900 hover:text-white transition-colors data-[active=true]:bg-neutral-800 data-[active=true]:text-white"
                                            >
                                                <MessageSquare size={14} className="mr-2 opacity-70" />
                                                <span className="truncate">{chat.title}</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-neutral-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-neutral-900 transition-colors text-left">
                            <Avatar className="h-8 w-8 ring-1 ring-neutral-700">
                                <AvatarFallback className="bg-neutral-800 text-neutral-300 text-xs">
                                    {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-sm font-medium text-white truncate">
                                    {session?.user?.email || "User"}
                                </span>
                                <span className="text-xs text-neutral-500">
                                    {(session?.user as { isPremium?: boolean } | undefined)?.isPremium ? "Premium Plan" : "Free Plan"}
                                </span>
                            </div>
                            <Settings size={14} className="text-neutral-500" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-neutral-900 border-neutral-800 text-neutral-200 p-2">
                        <UserControlDialog />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="focus:bg-red-900/30 focus:text-red-400 text-red-500 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
