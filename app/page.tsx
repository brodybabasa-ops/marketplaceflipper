import { LandingPage } from "@/components/marketing/landing-page";
import { getLandingShowcase } from "@/services/landing";

export default async function HomePage() {
  const { shops, reviews } = await getLandingShowcase();
  return <LandingPage shops={shops} reviews={reviews} />;
}
