import { BarChart3, Medal, QrCode, Trophy } from "lucide-react";
import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import teamPhoto from "../MoraTeam.jpeg";

// A condensed, sporty display face for the photo headline only.
const display = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const FEATURES = [
  { icon: QrCode, label: "QR check-in" },
  { icon: BarChart3, label: "Live Attendance" },
  { icon: Medal, label: "Player Ranking" },
  { icon: Trophy, label: "Match Results" },
];

/**
 * Split-screen auth shell shared by login, sign-up and password reset.
 * The team photo fills a framed panel (a hero banner on phones); the form sits on
 * the theme background (warm off-white, or near-black in dark mode) under a soft
 * teal glow, matching the signed-in app.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-background bg-app-glow text-foreground lg:flex-row">
      {/* Over the photo on phones (light icon), over the form panel on desktop. */}
      <ThemeToggle className="absolute top-4 right-4 z-20 text-white hover:bg-white/15 hover:text-white lg:top-6 lg:right-6 lg:text-foreground lg:hover:bg-muted lg:hover:text-foreground" />
      {/* Photo panel */}
      <section className="relative h-[46dvh] min-h-72 shrink-0 lg:sticky lg:top-0 lg:h-dvh lg:w-[58%] lg:p-4">
        <div className="relative h-full overflow-hidden lg:rounded-[2rem] lg:shadow-2xl lg:shadow-navy/25 lg:ring-1 lg:ring-navy/10 dark:lg:shadow-none dark:lg:ring-white/10">
          <Image
            src={teamPhoto}
            alt="The Mora Football squad together on the pitch"
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover object-[50%_40%] motion-safe:animate-[auth-zoom_18s_ease-out_both]"
          />
          {/* Legibility: darken the top for the crest and the bottom for the headline. */}
          <div className="absolute inset-0 bg-linear-to-b from-navy/75 via-navy/5 to-navy/60" aria-hidden />
          {/* A deeper scrim under the headline (desktop only; phones show no headline). */}
          <div className="absolute inset-x-0 bottom-0 hidden h-3/5 bg-linear-to-t from-navy via-navy/80 to-transparent lg:block" aria-hidden />
          <div className="absolute inset-0 bg-linear-to-r from-navy/45 to-transparent" aria-hidden />
          {/* On phones the photo melts into the form surface below it. */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent lg:hidden" aria-hidden />

          <div className="absolute inset-x-0 top-0 p-5 pr-16 lg:p-8">
            <BrandMark size={38} priority wordmarkClassName="text-white drop-shadow" />
          </div>

          <div className="absolute inset-x-0 bottom-0 hidden p-8 lg:block xl:p-12">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.25em] text-brand uppercase">
              <span className="h-px w-8 bg-brand" aria-hidden />
              Team Mora
            </p>
            <h2 className={`${display.className} text-6xl leading-[0.9] text-white xl:text-7xl`}>
              One Dream.
              <br />
              <span className="bg-brand-gradient bg-clip-text text-transparent">One Family.</span>
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
                >
                  <Icon className="size-3.5 text-brand" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative z-10 -mt-14 flex flex-1 items-start justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-10 lg:py-10">
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <div className="relative w-full max-w-sm motion-safe:animate-[auth-rise_0.5s_ease-out_both]">{children}</div>
      </section>
    </main>
  );
}
