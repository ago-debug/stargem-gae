import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListTodo, CheckSquare } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Todo } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function TodoNotification() {
    const [isOpen, setIsOpen] = useState(false);

    const { data: todos = [] } = useQuery<Todo[]>({
        queryKey: ["/api/todos"],
        // Polling every 10 seconds to keep the badge up to date (real-time feel)
        refetchInterval: 10000,
    });

    const pendingCount = todos.filter((t) => !t.completed).length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12">
                    <ListTodo className="h-7 w-7" />
                    {pendingCount > 0 && (
                        <Badge
                            className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[12px] font-bold bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            {pendingCount > 9 ? "9+" : pendingCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                        <CheckSquare className="h-4 w-4" />
                        Todo List
                    </div>
                    {pendingCount === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">Nessun task in sospeso.</p>
                    ) : (
                        <p className="text-sm text-muted-foreground py-2">
                            Hai <strong className="text-foreground">{pendingCount}</strong> task da completare.
                        </p>
                    )}
                    <Link href="/todo-list">
                        <Button className="w-full text-xs" size="sm" onClick={() => setIsOpen(false)}>
                            Vai alla Todo List
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
