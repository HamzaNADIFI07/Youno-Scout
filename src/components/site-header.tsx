import { ScoutLogo } from "@/components/scout-logo";

type Props = {
  variant?: "transparent" | "bordered";
};

export function SiteHeader({ variant = "transparent" }: Props) {
  return (
    <header
      className={
        variant === "bordered"
          ? "border-b border-border/70"
          : "border-b border-transparent"
      }
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <ScoutLogo />
      </div>
    </header>
  );
}
