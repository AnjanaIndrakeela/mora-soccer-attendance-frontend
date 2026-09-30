import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-2xl">
      <CardHeader className="items-center text-center">
        <Image src="/logo.jpg" alt="Mora Football" width={72} height={72} className="mx-auto rounded-full" priority />
        <CardTitle className="mt-2 text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
