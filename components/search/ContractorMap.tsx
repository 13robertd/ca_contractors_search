"use client";

import { createElement, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mapboxgl from "mapbox-gl";
import type { LucideIcon } from "lucide-react";
import {
  DEFAULT_TRADE,
  TRADE_COLORS,
  TRADE_HEX,
  getTradeHex,
  getTradePaletteKey,
  getTradeStyle,
} from "@/lib/trade-colors";
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
  /** Clear list/map selection when the user clicks empty map (not a pin or cluster). */
  onClearSelection?: () => void;
  initialCenter?: LngLat;
  initialZoom?: number;
  /** Pass false to suppress bounds updates (used when "search on move" is off). */
  emitBoundsOnMove?: boolean;
}

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

const SOURCE_ID = "contractors";
const LAYER_CLUSTER = "cm-clusters";
const LAYER_CLUSTER_COUNT = "cm-cluster-count";
const LAYER_UNCLUSTERED_HALO = "cm-unclustered-halo";
const LAYER_UNCLUSTERED_CIRCLE = "cm-unclustered-circle";
const LAYER_UNCLUSTERED_ICON = "cm-unclustered-icon";

const TRADE_PALETTE_ORDER = Object.keys(TRADE_COLORS) as (keyof typeof TRADE_COLORS)[];

const ICON_RASTER_PX = 20;

function tradeOrdinal(trade: string | null | undefined): number {
  const pk = getTradePaletteKey(trade);
  if (!pk) return -1;
  return TRADE_PALETTE_ORDER.indexOf(pk);
}

function iconIdForOrdinal(ord: number): string {
  if (ord < 0) return "trade-icon-default";
  return `trade-icon-${ord}`;
}

function buildClusterColorExpr(): mapboxgl.ExpressionSpecification {
  const matchExpr: unknown[] = ["match", ["get", "min_ord"]];
  TRADE_PALETTE_ORDER.forEach((key, i) => {
    matchExpr.push(i, TRADE_HEX[key]);
  });
  matchExpr.push("#374151");
  return [
    "case",
    [
      "all",
      ["==", ["get", "min_ord"], ["get", "max_ord"]],
      [">=", ["get", "min_ord"], 0],
    ],
    matchExpr,
    "#374151",
  ] as mapboxgl.ExpressionSpecification;
}

function listingsToGeoJSON(listings: ContractorListing[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const l of listings) {
    if (l.latitude == null || l.longitude == null) continue;
    const ord = tradeOrdinal(l.primary_trade);
    features.push({
      type: "Feature",
      id: l.license_number,
      geometry: {
        type: "Point",
        coordinates: [l.longitude, l.latitude],
      },
      properties: {
        license_number: l.license_number,
        business_name: l.business_name,
        primary_trade: l.primary_trade ?? "",
        trade_label: getTradeStyle(l.primary_trade).label,
        trade_hex: getTradeHex(l.primary_trade),
        trade_ord: ord,
        icon_id: iconIdForOrdinal(ord),
        city: l.city ?? "",
      },
    });
  }
  return { type: "FeatureCollection", features };
}

async function svgToImageData(svgMarkup: string, size: number): Promise<ImageData> {
  const svg =
    svgMarkup.startsWith("<svg") && !svgMarkup.includes("xmlns=")
      ? svgMarkup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
      : svgMarkup;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("pin icon image failed to load"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

async function rasterizeLucideIcon(Icon: LucideIcon): Promise<ImageData> {
  const markup = renderToStaticMarkup(
    createElement(Icon, {
      size: ICON_RASTER_PX,
      color: "#ffffff",
      stroke: "#ffffff",
      fill: "none",
      strokeWidth: 2.25,
      "aria-hidden": true,
    })
  );
  return svgToImageData(markup, ICON_RASTER_PX);
}

async function ensureTradeIconImages(map: mapboxgl.Map): Promise<void> {
  for (let ord = 0; ord < TRADE_PALETTE_ORDER.length; ord++) {
    const id = iconIdForOrdinal(ord);
    if (map.hasImage(id)) continue;
    const Icon = TRADE_COLORS[TRADE_PALETTE_ORDER[ord]].icon;
    const data = await rasterizeLucideIcon(Icon);
    map.addImage(id, data, { pixelRatio: 1 });
  }
  if (!map.hasImage("trade-icon-default")) {
    const data = await rasterizeLucideIcon(DEFAULT_TRADE.icon);
    map.addImage("trade-icon-default", data, { pixelRatio: 1 });
  }
}

const radiusExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  14,
  [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "listHover"], false],
  ],
  12,
  10,
] as mapboxgl.ExpressionSpecification;

const strokeWidthExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  3,
  2,
] as mapboxgl.ExpressionSpecification;

const translateExpr: mapboxgl.ExpressionSpecification = [
  "case",
  [
    "all",
    ["boolean", ["feature-state", "selected"], false],
    ["boolean", ["feature-state", "hover"], false],
  ],
  ["literal", [0, 0]],
  [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "listHover"], false],
  ],
  ["literal", [0, -2]],
  ["literal", [0, 0]],
] as mapboxgl.ExpressionSpecification;

const iconSizeExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  14 / ICON_RASTER_PX,
  [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "listHover"], false],
  ],
  12 / ICON_RASTER_PX,
  10 / ICON_RASTER_PX,
] as mapboxgl.ExpressionSpecification;

const iconTranslateExpr: mapboxgl.ExpressionSpecification = [
  "case",
  [
    "all",
    ["boolean", ["feature-state", "selected"], false],
    ["boolean", ["feature-state", "hover"], false],
  ],
  ["literal", [0, 0]],
  [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "listHover"], false],
  ],
  ["literal", [0, -2]],
  ["literal", [0, 0]],
] as mapboxgl.ExpressionSpecification;

export default function ContractorMap({
  listings,
  highlightedId,
  selectedId,
  onBoundsChange,
  onMarkerHover,
  onMarkerSelect,
  onClearSelection,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  emitBoundsOnMove = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const emitOnMoveRef = useRef(emitBoundsOnMove);
  emitOnMoveRef.current = emitBoundsOnMove;

  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onMarkerHoverRef = useRef(onMarkerHover);
  onMarkerHoverRef.current = onMarkerHover;
  const onMarkerSelectRef = useRef(onMarkerSelect);
  onMarkerSelectRef.current = onMarkerSelect;
  const onClearSelectionRef = useRef(onClearSelection);
  onClearSelectionRef.current = onClearSelection;

  const listingsRef = useRef(listings);
  listingsRef.current = listings;

  const hoverPinIdRef = useRef<string | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const prevSelectedForStateRef = useRef<string | null>(null);
  const prevHighlightForStateRef = useRef<string | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  useEffect(() => {
    if (!containerRef.current || !token) return;
    if (mapRef.current) return;

    let cancelled = false;

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

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: "contractor-pin-popup",
      maxWidth: "280px",
    });
    popupRef.current = popup;

    const emit = () => {
      if (!emitOnMoveRef.current) return;
      const b = map.getBounds();
      if (!b) return;
      onBoundsChangeRef.current({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    };

    const clearPopupTimer = () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }
    };

    const hidePopup = () => {
      clearPopupTimer();
      popup.remove();
    };

    const schedulePopup = (feature: mapboxgl.MapboxGeoJSONFeature) => {
      clearPopupTimer();
      const props = feature.properties as Record<string, string> | null;
      if (!props) return;
      const geom = feature.geometry;
      if (geom.type !== "Point") return;
      const [lng, lat] = geom.coordinates;

      popupTimerRef.current = setTimeout(() => {
        const tradeLine = [props.trade_label, props.city].filter(Boolean).join(" · ");
        popup
          .setLngLat([lng, lat])
          .setHTML(
            `<div class="contractor-pin-popup-inner">` +
              `<div class="contractor-pin-popup-name">${escapeHtml(props.business_name)}</div>` +
              `<div class="contractor-pin-popup-meta">${escapeHtml(tradeLine)}</div>` +
              `</div>`
          )
          .addTo(map);
      }, 100);
    };

    const setHoverPin = (nextId: string | null, feature?: mapboxgl.MapboxGeoJSONFeature) => {
      // Same pin: no-op. (Allow repeated null to still run cleanup when needed.)
      if (nextId !== null && hoverPinIdRef.current === nextId) return;
      if (hoverPinIdRef.current) {
        map.removeFeatureState({ source: SOURCE_ID, id: hoverPinIdRef.current }, "hover");
      }
      hoverPinIdRef.current = nextId;
      if (nextId) {
        map.setFeatureState({ source: SOURCE_ID, id: nextId }, { hover: true });
        onMarkerHoverRef.current(nextId);
        if (feature) schedulePopup(feature);
      } else {
        onMarkerHoverRef.current(null);
        hidePopup();
      }
    };

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_UNCLUSTERED_CIRCLE],
      });
      const top = feats[0];
      const nextId =
        top && top.id != null ? String(top.id) : (top?.properties?.license_number as string | undefined) ?? null;

      if (nextId) {
        map.getCanvas().style.cursor = "pointer";
        setHoverPin(nextId, top);
      } else {
        map.getCanvas().style.cursor = "";
        setHoverPin(null);
      }
    };

    const onMouseLeaveCanvas = () => {
      map.getCanvas().style.cursor = "";
      setHoverPin(null);
    };

    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      const clusterHits = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTER] });
      if (clusterHits.length > 0) {
        const hit = clusterHits[0];
        const clId = hit.properties?.cluster_id;
        const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
        const coords = (hit.geometry as GeoJSON.Point).coordinates as [number, number];
        if (clId != null && typeof src.getClusterExpansionZoom === "function") {
          src.getClusterExpansionZoom(Number(clId), (err, zoom) => {
            if (err || zoom == null) return;
            map.easeTo({ center: coords, zoom });
          });
        }
        return;
      }

      const pinHits = map.queryRenderedFeatures(e.point, { layers: [LAYER_UNCLUSTERED_CIRCLE] });
      if (pinHits.length > 0) {
        const id = String(pinHits[0].id ?? pinHits[0].properties?.license_number);
        onMarkerSelectRef.current(id);
        return;
      }

      onClearSelectionRef.current?.();
    };

    map.on("load", () => {
      void (async () => {
        try {
          await ensureTradeIconImages(map);
        } catch (err) {
          console.error("ContractorMap: failed to load trade icons", err);
          return;
        }
        if (cancelled || !mapRef.current) return;

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: listingsToGeoJSON(listingsRef.current),
          cluster: true,
          clusterRadius: 50,
          clusterProperties: {
            min_ord: ["min", ["get", "trade_ord"]],
            max_ord: ["max", ["get", "trade_ord"]],
          },
        });

        map.addLayer({
          id: LAYER_CLUSTER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": buildClusterColorExpr(),
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              10,
              22,
              50,
              28,
            ],
            "circle-opacity": 0.92,
          },
        });

        map.addLayer({
          id: LAYER_CLUSTER_COUNT,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 13,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        map.addLayer({
          id: LAYER_UNCLUSTERED_HALO,
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": 16,
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-width": 1,
            "circle-stroke-color": ["get", "trade_hex"],
            "circle-translate": translateExpr,
            "circle-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 1, 0],
          },
        });

        map.addLayer({
          id: LAYER_UNCLUSTERED_CIRCLE,
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": radiusExpr,
            "circle-color": ["get", "trade_hex"],
            "circle-stroke-width": strokeWidthExpr,
            "circle-stroke-color": "#ffffff",
            "circle-translate": translateExpr,
            "circle-opacity": 1,
          },
        });

        map.addLayer({
          id: LAYER_UNCLUSTERED_ICON,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": ["get", "icon_id"],
            "icon-size": iconSizeExpr,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
          paint: {
            "icon-translate": iconTranslateExpr,
          },
        });

        if (cancelled || !mapRef.current) return;

        map.on("mousemove", onMouseMove);
        map.on("mouseout", onMouseLeaveCanvas);
        map.on("click", onMapClick);

        emit();
      })();
    });

    map.on("moveend", emit);
    map.on("zoomend", emit);

    return () => {
      cancelled = true;
      hidePopup();
      map.remove();
      mapRef.current = null;
      hoverPinIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(listingsToGeoJSON(listings));
  }, [listings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (!map.getSource(SOURCE_ID)) return;

    const prev = prevSelectedForStateRef.current;
    if (prev && prev !== selectedId) {
      map.removeFeatureState({ source: SOURCE_ID, id: prev }, "selected");
    }
    if (selectedId) {
      map.setFeatureState({ source: SOURCE_ID, id: selectedId }, { selected: true });
    }
    prevSelectedForStateRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (!map.getSource(SOURCE_ID)) return;

    const prev = prevHighlightForStateRef.current;
    if (prev && prev !== highlightedId) {
      map.removeFeatureState({ source: SOURCE_ID, id: prev }, "listHover");
    }
    if (highlightedId) {
      map.setFeatureState({ source: SOURCE_ID, id: highlightedId }, { listHover: true });
    }
    prevHighlightForStateRef.current = highlightedId;
  }, [highlightedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const row = listings.find((l) => l.license_number === selectedId);
    if (row?.latitude == null || row.longitude == null) return;
    map.easeTo({
      center: [row.longitude, row.latitude],
      duration: 400,
    });
  }, [selectedId, listings]);

  if (!token) {
    return <MissingTokenFallback />;
  }

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function MissingTokenFallback() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden map-placeholder flex items-center justify-center p-6">
      <div className="max-w-sm bg-white/95 backdrop-blur rounded-xl border border-line p-5 shadow-card text-center">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white mb-3">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M2.94 2.94a1 1 0 0 1 1.41 0L10 8.59l5.66-5.65a1 1 0 0 1 1.41 1.41L11.41 10l5.66 5.66a1 1 0 0 1-1.41 1.41L10 11.41l-5.66 5.66a1 1 0 0 1-1.41-1.41L8.59 10 2.94 4.34a1 1 0 0 1 0-1.41Z" />
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
