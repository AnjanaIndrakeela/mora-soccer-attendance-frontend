import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** The form card on the auth pages. The crest lives on the photo panel, so the card leads with a gold kicker. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="relative overflow-hidden border-0 bg-card/85 shadow-xl shadow-black/5 ring-black/5 backdrop-blur-xl dark:bg-card/80 dark:shadow-2xl dark:shadow-black/60 dark:ring-white/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-brand to-transparent" aria-hidden />
      <CardHeader className="gap-1.5 pt-2">
        <p className="text-xs font-medium tracking-[0.25em] text-brand-text uppercase">Mora Football</p>
        <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
