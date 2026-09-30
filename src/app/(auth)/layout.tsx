import Image from "next/image";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-4 py-10">
      <Image src="/login-bg.svg" alt="" fill priority unoptimized className="object-cover" />
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative w-full max-w-sm">{children}</div>
    </main>
  );
}
