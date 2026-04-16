import { ContactSection } from "@/components/ContactSection";
import { FAQSection } from "@/components/FAQSection";
import { HeroSection } from "@/components/HeroSection";
import { ProcessSection } from "@/components/ProcessSection";
import { ReasonsSection } from "@/components/ReasonsSection";
import { ServicesSection } from "@/components/ServicesSection";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <ReasonsSection />
      <FAQSection />
      <ContactSection />
    </div>
  );
}
