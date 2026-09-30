"use client";

import { BarChart3, CalendarDays, LayoutDashboard, LogOut, Menu, Trophy, UserRound, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useLogout, useMe } from "@/lib/queries";
import type { User } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Users },
  { href: "/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const logout = useLogout();
  const name = user.player?.name ?? (user.role === "ADMIN" ? "Admin" : user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-9 gap-2 px-1.5 text-white hover:bg-white/10 hover:text-white" />}
        aria-label="Account menu"
      >
        <PlayerAvatar player={{ name, profilePicUrl: user.player?.profilePicUrl ?? null }} size="sm" />
        <span className="hidden max-w-32 truncate text-sm sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="truncate text-sm font-medium text-foreground">{user.email}</div>
            <div className="text-xs">{user.role === "ADMIN" ? "Admin" : "Player"}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.playerId && (
          <DropdownMenuItem render={<Link href={`/team/${user.playerId}`} />}>
            <UserRound />
            My profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logout.mutate(undefined, { onSettled: () => router.replace("/login") })}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  // A stale or invalid cookie: clear it so the proxy stops treating us as logged in.
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;
  useEffect(() => {
    if (unauthorized) logout.mutate(undefined, { onSettled: () => router.replace("/login") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unauthorized]);

  const user = me.data;

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-muted/40">
      <header className="sticky top-0 z-40 bg-[#0b0b0b] text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white md:hidden" />}
              aria-label="Open navigation"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#0b0b0b] text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Mora Football</SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={() => setMenuOpen(false)} className="flex flex-col gap-1 px-2" />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.jpg" alt="" width={32} height={32} className="rounded-full" />
            <span className="hidden sm:inline">
              Mora <span className="text-brand">Football</span>
            </span>
          </Link>

          <NavLinks className="ml-4 hidden items-center gap-1 md:flex" />

          <div className="ml-auto">{user ? <UserMenu user={user} /> : <Skeleton className="size-8 rounded-full bg-white/10" />}</div>
        </div>
      </header>

      {user?.role === "PLAYER" && user.playerId && !user.playerConfirmedAt && (
        <div className="border-b border-status-warning/40 bg-status-warning/15 px-4 py-2 text-center text-sm">
          Your account is waiting for an admin to confirm your roster entry. You can check in to sessions once it&apos;s confirmed.
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
        {me.isPending || unauthorized ? <ShellSkeleton /> : children}
      </main>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

/** Current user from the cached /auth/me query (the shell guarantees it is loaded). */
export function useCurrentUser() {
  const { data } = useMe();
  return { user: data, isAdmin: data?.role === "ADMIN" };
}
