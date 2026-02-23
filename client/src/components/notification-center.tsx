
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Mail, StickyNote, Info } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", `/api/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/notifications/read-all");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "message":
                return <Mail className="h-4 w-4 text-blue-500" />;
            case "note":
                return <StickyNote className="h-4 w-4 text-orange-500" />;
            default:
                return <Info className="h-4 w-4 text-slate-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifiche</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            Segna tutte come lette
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">Nessuna notifica</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col p-4 border-b hover:bg-muted/50 transition-colors relative",
                                        !notification.isRead && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">{getIcon(notification.type)}</div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-sm font-medium", !notification.isRead && "font-bold text-primary")}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => markReadMutation.mutate(notification.id)}
                                                        disabled={markReadMutation.isPending}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {format(new Date(notification.createdAt || new Date()), "d MMM HH:mm", { locale: it })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
