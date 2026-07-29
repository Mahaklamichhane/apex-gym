import type { ReactNode } from "react";

/**
 * Authenticated app shell. The root middleware already guards these routes
 * (redirects to /login when signed out). The sidebar + top bar + command
 * palette will live here — for now it's a minimal centered container so the
 * routes render while we build the shell.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
