import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestGae() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>test Gae</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Pagina di test</p>
        </CardContent>
      </Card>
    </div>
  );
}
