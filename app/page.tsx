import Link from "next/link";
import { routes } from "@/constants/routes";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Apex Gym
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Your personal fitness
          <br /> operating system.
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground text-pretty">
          Track every set, watch your strength compound, and let the data tell
          you what to do next.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={routes.dashboard}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open dashboard
        </Link>
        <Link
          href={routes.login}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
