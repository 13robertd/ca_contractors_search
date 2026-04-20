"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  type Bounds,
  type LngLat,
} from "@/lib/geo";
import type { ContractorListing } from "@/lib/listings";

interface Props {
  listings: ContractorListing[];
  highlightedId: string | null;
  selectedId: string | null;
  onBoundsChange: (b: Bounds) => void;
  onMarkerHover: (id: string | null) => void;
  onMarkerSelect: (id: string) => void;
  initialCenter?: LngLat;
  initialZoom?: number;
  /** Pass false to suppress bounds updates (used when "search on move" is off). */
  emitBoundsOnMove?: boolean;
}

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

export default function ContractorMap({
  listings,
  highlightedId,
  selectedId,
  onBoundsChange,
  onMarkerHover,
  onMarkerSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  emitBoundsOnMove = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const emitOnMoveRef = useRef(emitBoundsOnMove);
  emitOnMoveRef.current = emitBoundsOnMove;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  /* ---------------- map init ---------------- */
  useEffect(() => {
    if (!containerRef.current || !token) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [initialCenter.longitude, initialCenter.latitude],
      zoom: initialZoom,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const emit = () => {
      if (!emitOnMoveRef.current) return;
      const b = map.getBounds();
      if (!b) return;
      onBoundsChange({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    };
    map.on("load", emit);
    map.on("moveend", emit);
    map.on("zoomend", emit);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---------------- markers sync ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const next = new Map<string, mapboxgl.Marker>();
    const wanted = new Set<string>();

    for (const l of listings) {
      if (l.latitude == null || l.longitude == null) continue;
      wanted.add(l.license_number);

      let marker = markersRef.current.get(l.license_number);
      if (!marker) {
        const el = buildMarkerEl(l);
        el.addEventListener("mouseenter", () => onMarkerHover(l.license_number));
        el.addEventListener("mouseleave", () => onMarkerHover(null));
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onMarkerSelect(l.license_number);
        });
        marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([l.longitude, l.latitude])
          .addTo(map);
      } else {
        marker.setLngLat([l.longitude, l.latitude]);
        // Refresh price label in case the same license re-renders with new data.
        const label = marker.getElement().querySelector(".cm-label");
        if (label) label.textContent = `$${l.hourlyRate}`;
      }
      next.set(l.license_number, marker);
    }

    // Remove markers for listings no longer in the set.
    for (const [id, marker] of markersRef.current) {
      if (!wanted.has(id)) marker.remove();
    }
    markersRef.current = next;
  }, [listings, onMarkerHover, onMarkerSelect]);

  /* ---------------- highlight sync ---------------- */
  useEffect(() => {
    const activeId = selectedId ?? highlightedId;
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      if (id === activeId) el.setAttribute("data-active", "true");
      else el.removeAttribute("data-active");
    }
  }, [highlightedId, selectedId]);

  /* ---------------- pan to selected ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    const ll = marker.getLngLat();
    map.easeTo({ center: [ll.lng, ll.lat], duration: 400 });
  }, [selectedId]);

  /* ---------------- token fallback ---------------- */
  if (!token) {
    return <MissingTokenFallback />;
  }

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function buildMarkerEl(l: ContractorListing): HTMLElement {
  const el = document.createElement("div");
  el.className = "cm-marker";
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `${l.business_name} — $${l.hourlyRate}/hr`);
  el.innerHTML = `
    <span class="cm-pill">
      <span class="cm-label">$${l.hourlyRate}</span>
    </span>
  `;
  return el;
}

function MissingTokenFallback() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden map-placeholder flex items-center justify-center p-6">
      <div className="max-w-sm bg-white/95 backdrop-blur rounded-xl border border-line p-5 shadow-card text-center">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white mb-3">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M2.94 2.94a1 1 0 0 1 1.41 0L10 8.59l5.66-5.65a1 1 0 1 1 1.41 1.41L11.41 10l5.66 5.66a1 1 0 0 1-1.41 1.41L10 11.41l-5.66 5.66a1 1 0 0 1-1.41-1.41L8.59 10 2.94 4.34a1 1 0 0 1 0-1.41Z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-ink">Map disabled</h3>
        <p className="mt-1 text-xs text-ink-muted leading-relaxed">
          Set <code className="font-mono text-[11px] bg-surface-subtle px-1 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
          in your environment to enable the interactive map. Get a free public token from{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
            className="underline text-ink hover:text-ink-muted"
          >
            mapbox.com
          </a>
          , then restart the dev server.
        </p>
      </div>
    </div>
  );
}
