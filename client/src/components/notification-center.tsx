import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TeamComment } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export function NotificationCenter() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: comments = [] } = useQuery<TeamComment[]>({
        queryKey: ["/api/team-comments"],
        refetchInterval: 10000, // Sync every 10s
    });

    const activeNotifications = useMemo(() => {
        if (!user) return [];
        return comments.filter(
            (c) => !c.isResolved && (c.assignedTo === "Tutti" || c.assignedTo === String(user.id))
        );
    }, [comments, user]);

    const unreadCount = activeNotifications.length;

    return (
        <Link href="/commenti">
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "relative h-12 w-12 mt-2 transition-colors",
                    unreadCount > 0 && "text-red-600 hover:text-red-700 hover:bg-red-50"
                )}
                data-testid="button-notification-center"
            >
                <div className="relative">
                    <Bell className={cn("h-8 w-8", unreadCount > 0 && "fill-red-100 text-red-600")} />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[11px] font-bold border-2 border-white"
                            data-testid="badge-unread-count"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </div>
            </Button>
        </Link>
    );
}
