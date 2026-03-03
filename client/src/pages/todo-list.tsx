import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2, Circle, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Todo } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function TodoList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState("");

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", "/api/todos", { text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodo("");
      toast({ title: "Task aggiunto con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiunta", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/todos/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({ title: "Task rimosso" });
    },
  });

  const addTodo = () => {
    if (newTodo.trim()) {
      createMutation.mutate(newTodo.trim());
    }
  };

  const handleCopilot = () => {
    toast({
      title: "CoPilot in arrivo",
      description: "Questa funzionalità AI sarà disponibile a breve.",
    });
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Cose da Fare
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{totalCount} completate
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Aggiungi nuova attività..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              data-testid="input-new-todo"
            />
            <Button onClick={handleCopilot} variant="outline" className="gap-2">
              <Bot className="w-4 h-4 text-primary" />
              CoPilot
            </Button>
            <Button onClick={addTodo} data-testid="button-add-todo" disabled={createMutation.isPending}>
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          </div>

          <div className="space-y-4">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessuna attività pendente. Aggiungi la prima!
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex flex-col gap-2 p-4 rounded-lg border transition-colors ${todo.completed
                    ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50"
                    : "bg-white border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                    }`}
                  data-testid={`todo-item-${todo.id}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => updateMutation.mutate({ id: todo.id, completed: !todo.completed })}
                      className="flex-shrink-0 mt-0.5"
                      data-testid={`button-toggle-${todo.id}`}
                      disabled={updateMutation.isPending}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 space-y-2">
                      <span
                        className={`block text-base ${todo.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
                          }`}
                      >
                        {todo.text}
                      </span>
                      {/* Audit Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                        <div>
                          creato da <span className="font-semibold">{todo.createdBy}</span>
                          {todo.createdAt && (
                            <span className="ml-1">
                              il {format(new Date(todo.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                            </span>
                          )}
                        </div>
                        {todo.completed && todo.completedBy && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            completato da <span className="font-semibold text-green-600 dark:text-green-400">{todo.completedBy}</span>
                            {todo.completedAt && (
                              <span className="ml-1">
                                il {format(new Date(todo.completedAt), "dd MMM yyyy HH:mm", { locale: it })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(todo.id)}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                      data-testid={`button-delete-${todo.id}`}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
