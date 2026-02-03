import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Test2Gae() {
  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="page-test2-gae">
      <Card>
        <CardHeader>
          <CardTitle>Test2 Gae</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Pagina in costruzione...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
