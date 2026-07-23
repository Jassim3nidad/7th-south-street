"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./BounceCards.css";

type BounceCardsProps = {
  className?: string;
  images?: string[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
};

const DEFAULT_TRANSFORMS = [
  "rotate(10deg) translate(-170px)",
  "rotate(5deg) translate(-85px)",
  "rotate(-3deg)",
  "rotate(-10deg) translate(85px)",
  "rotate(2deg) translate(170px)",
];

const withoutRotation = (transform: string) => {
  if (/rotate\([\s\S]*?\)/.test(transform)) {
    return transform.replace(/rotate\([\s\S]*?\)/, "rotate(0deg)");
  }
  return transform === "none" ? "rotate(0deg)" : `${transform} rotate(0deg)`;
};

const withHorizontalOffset = (transform: string, offset: number) => {
  const translation = /translate\(([-0-9.]+)px\)/;
  const match = transform.match(translation);
  if (match) {
    return transform.replace(translation, `translate(${Number.parseFloat(match[1]) + offset}px)`);
  }
  return transform === "none" ? `translate(${offset}px)` : `${transform} translate(${offset}px)`;
};

export default function BounceCards({
  className = "",
  images = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = "elastic.out(1, 0.8)",
  transformStyles = DEFAULT_TRANSFORMS,
  enableHover = true,
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        ".bounce-card",
        { scale: 0 },
        {
          scale: 1,
          stagger: animationStagger,
          ease: easeType,
          delay: animationDelay,
        },
      );
    }, containerRef);

    return () => context.revert();
  }, [animationDelay, animationStagger, easeType]);

  const pushSiblings = (hoveredIndex: number) => {
    if (!enableHover || !containerRef.current) return;
    const select = gsap.utils.selector(containerRef);

    images.forEach((_, index) => {
      const target = select(`.bounce-card--${index}`);
      gsap.killTweensOf(target);
      const baseTransform = transformStyles[index] ?? "none";
      const transform =
        index === hoveredIndex
          ? withoutRotation(baseTransform)
          : withHorizontalOffset(baseTransform, index < hoveredIndex ? -110 : 110);

      gsap.to(target, {
        transform,
        duration: 0.4,
        ease: "back.out(1.4)",
        delay: index === hoveredIndex ? 0 : Math.abs(hoveredIndex - index) * 0.05,
        overwrite: "auto",
      });
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    const select = gsap.utils.selector(containerRef);

    images.forEach((_, index) => {
      const target = select(`.bounce-card--${index}`);
      gsap.killTweensOf(target);
      gsap.to(target, {
        transform: transformStyles[index] ?? "none",
        duration: 0.4,
        ease: "back.out(1.4)",
        overwrite: "auto",
      });
    });
  };

  return (
    <div
      ref={containerRef}
      className={`bounce-cards${className ? ` ${className}` : ""}`}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {images.map((source, index) => (
        <div
          key={`${source}-${index}`}
          className={`bounce-card bounce-card--${index}`}
          style={{ transform: transformStyles[index] ?? "none" }}
          onMouseEnter={() => pushSiblings(index)}
          onMouseLeave={resetSiblings}
        >
          <Image
            className="bounce-card__image"
            src={source}
            alt=""
            fill
            unoptimized
            sizes="200px"
          />
        </div>
      ))}
    </div>
  );
}
