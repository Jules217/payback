import Link from "next/link";
import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Wallet className="size-6 text-primary" />
        <span className="text-lg font-semibold">Payback</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
