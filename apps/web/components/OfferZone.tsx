"use client";

import type { OfferCarouselDto, StoreThemeId } from "@rimss/shared-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export interface OfferZoneProps {
  carousel: OfferCarouselDto;
  theme: StoreThemeId;
}

export function OfferZone({ carousel, theme }: OfferZoneProps): JSX.Element {
  const slides = carousel.slides;
  const [i, setI] = useState(0);

  const next = useCallback(() => {
    setI((v) => (slides.length ? (v + 1) % slides.length : 0));
  }, [slides.length]);

  const prev = useCallback(() => {
    setI((v) => (slides.length ? (v - 1 + slides.length) % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, [slides.length, next]);

  if (slides.length === 0) {
    return (
      <section
        className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500"
        data-store-theme={theme}
      >
        No offer slides configured.
      </section>
    );
  }

  const slide = slides[i]!;

  return (
    <section
      className="offer-zone overflow-hidden rounded-xl border shadow-sm"
      data-store-theme={theme}
    >
      <div className="flex flex-col gap-1 border-b border-[var(--offer-border)] bg-[var(--offer-bar)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {carousel.heading ? (
          <h2 className="text-sm font-semibold text-[var(--offer-text)]">{carousel.heading}</h2>
        ) : (
          <span className="text-sm font-medium text-[var(--offer-muted)]">Offers</span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--offer-muted)]">
            Module: <code className="rounded bg-black/5 px-1">OfferZone</code> · theme{" "}
            <code className="rounded bg-black/5 px-1">{theme}</code>
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:grid-cols-2 sm:items-center sm:p-6">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[var(--offer-surface)] sm:aspect-[4/3]">
          {slide.imageUrl ? (
            <img
              alt=""
              src={slide.imageUrl}
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--offer-muted)]">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--offer-accent)]">
            Slide {i + 1} / {slides.length}
          </p>
          <h3 className="text-xl font-semibold text-[var(--offer-text)] sm:text-2xl">{slide.title}</h3>
          {slide.subtitle ? (
            <p className="text-sm leading-relaxed text-[var(--offer-muted)]">{slide.subtitle}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={slide.href}
              className="inline-flex rounded-md bg-[var(--offer-accent)] px-4 py-2.5 text-sm font-medium text-[var(--offer-on-accent)] hover:opacity-90"
            >
              {slide.ctaLabel}
            </Link>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={prev}
                className="rounded-md border border-[var(--offer-border)] bg-[var(--offer-surface)] px-3 py-2 text-sm text-[var(--offer-text)] hover:bg-black/5"
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-md border border-[var(--offer-border)] bg-[var(--offer-surface)] px-3 py-2 text-sm text-[var(--offer-text)] hover:bg-black/5"
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 border-t border-[var(--offer-border)] bg-[var(--offer-bar)] px-4 py-3">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setI(idx)}
            className={`h-2 w-2 rounded-full transition ${
              idx === i ? "bg-[var(--offer-accent)]" : "bg-[var(--offer-muted)] opacity-40"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === i}
          />
        ))}
      </div>
    </section>
  );
}
