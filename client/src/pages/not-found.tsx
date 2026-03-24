import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-4 gap-4">
            <AlertCircle className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900">
              404 Page Not Found
            </h1>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
