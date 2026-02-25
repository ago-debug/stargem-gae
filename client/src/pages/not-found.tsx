import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-4 gap-4">
            <AlertCircle className="h-16 w-16 text-yellow-500 animate-pulse" />
            <h1 className="text-4xl font-extrabold text-primary tracking-tighter">
              PAGINA IN ALLESTIMENTO
            </h1>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">404 Page Not Found</h2>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600 italic">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
