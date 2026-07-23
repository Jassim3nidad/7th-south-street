import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CursorGrid from "@/components/ui/CursorGrid";

export default function HeroSection() {
  return (
    <section className="neo-hero" aria-labelledby="home-hero-heading">
      <div className="neo-hero__glow" aria-hidden="true" />

      <div className="site-container neo-hero__grid">
        <div className="neo-hero__copy">
          <h1
            id="home-hero-heading"
            className="neo-heading neo-hero__title max-w-full animate-fade-in uppercase tracking-[0.02em]"
            style={{ fontSize: "clamp(3.1rem, 6vw, 6.75rem)" }}
          >
            <span className="block">Nonchalant</span>
            <span className="block">Luxury.</span>
          </h1>
          <p
            className="mb-8 max-w-xl text-lg font-medium leading-relaxed animate-slide-up sm:text-xl"
            style={{ color: "var(--neo-text-muted)" }}
          >
            Underground Culture. Premium streetwear designed for the few.
          </p>
          <div className="neo-hero__actions animate-slide-up">
            <Link href="/shop" className="btn-primary">
              Explore Collection <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="neo-hero__art neo-surface" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            poster="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, rgb(var(--neo-surface-strong-rgb) / 0.08), rgb(var(--neo-text-rgb) / 0.28))",
            }}
          />
          <CursorGrid
            className="neo-hero__cursor-grid"
            cellSize={64}
            color="#79AAFF"
            radius={150}
            holdTime={320}
            fadeDuration={900}
            lineWidth={1.1}
            maxOpacity={0.9}
            fillOpacity={0.035}
            gridOpacity={0.06}
            cellRadius={6}
            pulseSpeed={560}
          />
        </div>
      </div>
    </section>
  );
}
