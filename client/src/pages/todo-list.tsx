import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function TodoList() {
  const defaultTodos: TodoItem[] = [
    { id: '1', text: 'Implementare verifica SMS/WhatsApp con Twilio per numeri di telefono', completed: false, createdAt: new Date().toISOString() },
    { id: '2', text: 'Implementare verifica email con invio link/codice OTP', completed: false, createdAt: new Date().toISOString() },
    { id: '3', text: 'Collegare bottone "Verifica" a Twilio (SMS) e SMTP (email) per verifica reale telefono/email in anagrafica', completed: false, createdAt: new Date().toISOString() },
  ];

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('project-todos');
    if (saved) {
      const existing: TodoItem[] = JSON.parse(saved);
      const existingTexts = existing.map(t => t.text);
      const newItems = defaultTodos.filter(d => !existingTexts.includes(d.text));
      if (newItems.length > 0) {
        return [...existing, ...newItems];
      }
      return existing;
    }
    return defaultTodos;
  });
  
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    localStorage.setItem('project-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: newTodo.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
        }
      ]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

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
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              data-testid="input-new-todo"
            />
            <Button onClick={addTodo} data-testid="button-add-todo">
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          </div>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessuna attività. Aggiungi la prima!
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    todo.completed 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                  data-testid={`todo-item-${todo.id}`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="flex-shrink-0"
                    data-testid={`button-toggle-${todo.id}`}
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <span 
                    className={`flex-1 ${
                      todo.completed 
                        ? 'line-through text-muted-foreground' 
                        : ''
                    }`}
                  >
                    {todo.text}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(todo.createdAt).toLocaleDateString('it-IT')}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteTodo(todo.id)}
                    className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                    data-testid={`button-delete-${todo.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
