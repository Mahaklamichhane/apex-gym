import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

// Single-user app: no landing/login. Go straight in (proxy auto-logs-in).
export default function Home() {
  redirect(routes.dashboard);
}
