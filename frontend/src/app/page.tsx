import HeroSection from "@/components/storefront/HeroSection";
import CampaignSection from "@/components/storefront/CampaignSection";
import PopUpCountdown from "@/components/storefront/PopUpCountdown";
import ProductGrid from "@/components/storefront/ProductGrid";
import BrandStory from "@/components/storefront/BrandStory";
import NewsletterForm from "@/components/storefront/NewsletterForm";

export default function MarketingHomePage() {
  return (
    <main className="site-shell">
      <HeroSection />
      <CampaignSection />
      <PopUpCountdown />
      <ProductGrid />
      <BrandStory />
      <NewsletterForm />
    </main>
  );
}
