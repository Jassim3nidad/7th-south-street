"use client";

import { useEffect, useState } from "react";
import { popUpEvent } from "@/lib/mock-store";
import { MapPin } from "lucide-react";

export default function PopUpCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(popUpEvent.date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="site-section" aria-labelledby="pop-up-heading">
      <div className="site-container">
        <div className="neo-panel mx-auto flex max-w-5xl flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-12">
        <p className="neo-kicker mb-4 flex items-center justify-center gap-2">
          <MapPin className="h-4 w-4" aria-hidden="true" /> {popUpEvent.location}
        </p>
        <h2 id="pop-up-heading" className="neo-heading mb-8 text-3xl sm:text-4xl">
          {popUpEvent.title}
        </h2>

        <dl
          className="mb-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"
          role="timer"
          aria-label={`Time remaining until ${popUpEvent.title}`}
          aria-live="off"
        >
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.minutes },
            { label: "Secs", value: timeLeft.seconds },
          ].map((item) => (
            <div key={item.label} className="neo-inset flex min-h-28 flex-col items-center justify-center p-4">
              <dt className="order-2 mt-2 text-xs font-bold uppercase tracking-widest neo-muted">
                {item.label}
              </dt>
              <dd
                className="order-1 font-display text-4xl font-semibold sm:text-5xl"
                style={{ color: "var(--neo-accent-strong)" }}
              >
                {String(item.value).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </dl>

        <p className="neo-muted max-w-xl leading-relaxed">
          {popUpEvent.description}
        </p>
        </div>
      </div>
    </section>
  );
}
