import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to onboarding page first
  redirect("/onboarding");
}
