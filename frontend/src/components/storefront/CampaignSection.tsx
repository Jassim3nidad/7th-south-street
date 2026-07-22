import Link from "next/link";
import Image from "next/image";
import { currentDrop } from "@/lib/mock-store";

export default function CampaignSection() {
  return (
    <section className="site-section" aria-labelledby="campaign-heading">
      <div className="site-container grid items-center gap-10 md:grid-cols-2 lg:gap-16">
        <div className="neo-surface group w-full overflow-hidden p-3">
          <div className="neo-inset relative h-[28rem] overflow-hidden sm:h-[32rem]">
            <Image
              src={currentDrop.imageUrl}
              alt={currentDrop.title}
              fill
              unoptimized
              sizes="(max-width: 767px) 100vw, 50vw"
              className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-[1.035] group-hover:grayscale-0"
            />
          </div>
        </div>
        <div className="flex flex-col items-start text-left">
          <p className="neo-kicker mb-4">
            {currentDrop.releaseDate}
          </p>
          <h2 id="campaign-heading" className="neo-heading mb-6 text-4xl md:text-5xl lg:text-6xl">
            {currentDrop.title}
          </h2>
          <p className="neo-muted mb-8 max-w-md text-lg leading-relaxed">
            {currentDrop.description}
          </p>
          <Link href="/shop" className="btn-outline">
            Preview Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
