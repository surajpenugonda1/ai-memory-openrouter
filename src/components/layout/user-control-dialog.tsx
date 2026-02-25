"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap, ArrowUpCircle } from "lucide-react";
import { getUserUsage } from "@/actions/openrouter";
import { Button } from "@/components/ui/button";

export function UserControlDialog() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [usage, setUsage] = useState<{ normal: number; premium: number; isPremium: boolean } | null>(null);
    const [loading, setLoading] = useState(false);

    // Artificial limits that could be moved to DB or config later
    const NORMAL_LIMIT = 100;
    const PREMIUM_LIMIT = (session?.user as { isPremium?: boolean } | undefined)?.isPremium ? 50 : 5;

    useEffect(() => {
        async function loadUsage() {
            if (open && session?.user?.id) {
                setLoading(true);
                const data = await getUserUsage(session.user.id);
                if (data) {
                    setUsage({
                        normal: data.normalMessageCount,
                        premium: data.premiumMessageCount,
                        isPremium: data.isPremium as boolean,
                    });
                }
                setLoading(false);
            }
        }
        loadUsage();
    }, [open, session]);

    const normalPercent = usage ? Math.min((usage.normal / NORMAL_LIMIT) * 100, 100) : 0;
    const premiumPercent = usage ? Math.min((usage.premium / PREMIUM_LIMIT) * 100, 100) : 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-neutral-800 focus:text-white cursor-pointer hover:bg-neutral-800 rounded-sm">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>User Controls & Usage</span>
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                        <Zap className="text-indigo-500" size={20} />
                        Usage Dashboard
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Monitor your monthly AI model usage. Live OpenRouter models are classified dynamically based on their pricing.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Plan Status */}
                    <div className="flex items-center justify-between p-4 bg-neutral-950/50 rounded-xl border border-neutral-800">
                        <div>
                            <p className="text-sm font-medium text-neutral-200">Current Plan</p>
                            <p className="text-xs text-neutral-500 mt-1">{usage?.isPremium ? "Pro Tier" : "Free Tier"}</p>
                        </div>
                        {usage?.isPremium ? (
                            <Badge className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-0">Premium Active</Badge>
                        ) : (
                            <Button size="sm" className="bg-white text-black hover:bg-neutral-200 h-8 text-xs font-medium">
                                <ArrowUpCircle className="mr-2 h-3.5 w-3.5" />
                                Upgrade
                            </Button>
                        )}
                    </div>

                    {/* Premium Models Usage */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-sm font-medium text-indigo-300 flex items-center gap-1.5">
                                    <Zap size={14} />
                                    Premium Models
                                </h4>
                                <p className="text-xs text-neutral-500 mt-0.5">Any model with a token cost &gt; $0.00</p>
                            </div>
                            <span className="text-sm font-mono text-neutral-300">
                                {loading ? "..." : `${usage?.premium || 0} / ${PREMIUM_LIMIT}`}
                            </span>
                        </div>
                        <Progress
                            value={premiumPercent}
                            className={`h-2 bg-neutral-800 ${premiumPercent > 90 ? "[&>div]:bg-red-500" : "[&>div]:bg-indigo-500"}`}
                        />
                    </div>

                    {/* Normal Models Usage */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-sm font-medium text-neutral-300">Normal Models</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">Free models costing exactly $0.00</p>
                            </div>
                            <span className="text-sm font-mono text-neutral-400">
                                {loading ? "..." : `${usage?.normal || 0} / ${NORMAL_LIMIT}`}
                            </span>
                        </div>
                        <Progress
                            value={normalPercent}
                            className={`h-2 bg-neutral-800 ${normalPercent > 90 ? "[&>div]:bg-red-500" : "[&>div]:bg-neutral-400"}`}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
