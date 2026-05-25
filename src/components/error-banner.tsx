import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  title: string;
  message: string;
};

export function ErrorBanner({ title, message }: Props) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
