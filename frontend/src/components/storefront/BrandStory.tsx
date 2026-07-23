import Image from "next/image";

export default function BrandStory() {
  return (
    <section id="brand" className="neo-story site-section scroll-mt-28" aria-labelledby="brand-story-heading">
      <div className="site-container neo-story__grid">
        <div className="neo-story__copy">
          <h2 id="brand-story-heading" className="neo-heading">
            The 7SS Archive
          </h2>
          <div className="neo-story__body">
            <p className="mb-8 text-base md:text-lg">
              Born in the underground of Manila, 7TH SOUTH STREET (7SS) challenges the conventions of modern streetwear. We don't chase trends; we engineer staples. Every piece is a study in nonchalant luxury—meticulously crafted for those who speak without shouting.
            </p>
            <p className="text-base font-bold md:text-lg">
              No third parties. No generic cuts. Just raw, unfiltered culture.
            </p>
          </div>
        </div>

        <div className="neo-story__visual neo-surface" aria-hidden="true">
          <div className="neo-story__logo neo-inset">
            <Image src="/logo.png" alt="" width={176} height={176} className="brand-logo" />
          </div>
        </div>
      </div>
    </section>
  );
}
