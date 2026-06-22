import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Centered container used by the login and register screens: brand mark on top,
 * then a titled card holding the form.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl leading-none text-brand">⬢</span>
        <span className="font-display text-lg font-bold tracking-tight">Veridel</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>

      {footer && (
        <p className="mt-5 text-sm text-muted-foreground">{footer}</p>
      )}
    </main>
  );
}
