import { redirect } from "next/navigation";

export default function HomePage() {
  // Always redirect to onboarding first
  redirect("/onboarding");
}
