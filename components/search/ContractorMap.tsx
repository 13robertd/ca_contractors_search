"use client";

import { createElement, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mapboxgl from "mapbox-gl";
import type { LucideIcon } from "lucide-react";
import {
  DEFAULT_TRADE,
  TRADE_COLORS,
  TRADE_HEX,
  getTradeIconHex,
  getTradePaletteKey,
  getTradeRingHex,
  getTradeStyle,
} from "@/lib/trade-colors";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  type Bounds,
  type LngLat,
} from "@/lib/geo";
import type { ContractorListing } from "@/lib/listings";
import { cardDataFromContractor } from "@/lib/cardData";
import { contractorMapTrustIssue } from "@/lib/trustSignals";
import type { TradeSlug } from "@/lib/trades";

interface Props {
  listings: ContractorListing[];
  highlightedId: string | null;
  selectedId: string | null;
  onBoundsChange: (b: Bounds) => void;
  onMarkerHover: (id: string | null) => void;
  onMarkerSelect: (id: string) => void;
  /** Same trade filter as the results list — drives display trade on markers. */
  searchTrade?: TradeSlug | null;
  /** Clear list/map selection when the user clicks empty map (not a pin or cluster). */
  onClearSelection?: () => void;
  initialCenter?: LngLat;
  initialZoom?: number;
  /** Pass false to suppress bounds updates (used when "search on move" is off). */
  emitBoundsOnMove?: boolean;
}

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

/** Clustered strong-precision pins (rooftop / street / interpolated). */
const SOURCE_PRECISE = "cm-contractors-precise";
const LAYER_CLUSTER = "cm-clusters";
const LAYER_CLUSTER_COUNT = "cm-cluster-count";
const LAYER_UNCLUSTERED_SHADOW = "cm-unclustered-shadow";
const LAYER_UNCLUSTERED_MAIN = "cm-unclustered-main";
const LAYER_UNCLUSTERED_ICON = "cm-unclustered-icon";
const LAYER_UNCLUSTERED_ISSUE = "cm-unclustered-issue";

/** City/zip approximate pins — not clustered so they do not inflate precise clusters. */
const SOURCE_APPROX = "cm-contractors-approx";
const LAYER_APPROX_SHADOW = "cm-approx-shadow";
const LAYER_APPROX_MAIN = "cm-approx-main";
const LAYER_APPROX_ICON = "cm-approx-icon";
const LAYER_APPROX_ISSUE = "cm-approx-issue";

const PIN_HOVER_LAYERS = [LAYER_UNCLUSTERED_MAIN, LAYER_APPROX_MAIN] as const;

/** Selected-card accent (see ContractorCardBase selected ring). */
const BRAND_SELECTION_HEX = "#4F7CAC";

const TRADE_PALETTE_ORDER = Object.keys(TRADE_COLORS) as (keyof typeof TRADE_COLORS)[];

/** Raster size for Lucide → `addImage` (slightly smaller marker footprint). */
const ICON_RASTER_PX = 20;

function tradeOrdinalFromDisplayLabel(displayTradeLabel: string): number {
  const pk = getTradePaletteKey(displayTradeLabel);
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

function contractorPointFeature(
  l: ContractorListing,
  searchTrade: TradeSlug | null | undefined
): GeoJSON.Feature<GeoJSON.Point> | null {
  if (l.latitude == null || l.longitude == null) return null;
  const card = cardDataFromContractor(l, { searchTrade: searchTrade ?? undefined });
  const displayLabel = card.primaryTradeLabel;
  const ord = tradeOrdinalFromDisplayLabel(displayLabel);
  const style = getTradeStyle(displayLabel);
  return {
    type: "Feature",
    id: l.license_number,
    geometry: {
      type: "Point",
      coordinates: [l.longitude, l.latitude],
    },
    properties: {
      license_number: l.license_number,
      business_name: l.business_name,
      display_trade: displayLabel,
      trade_label: style.label,
      trade_hex: getTradeRingHex(displayLabel),
      trade_ord: ord,
      icon_id: iconIdForOrdinal(ord),
      city: l.city ?? "",
      has_issue: contractorMapTrustIssue(l) ? 1 : 0,
      is_approximate: l.mapPinKind === "approximate" ? 1 : 0,
    },
  };
}

function listingsToPreciseGeoJSON(
  listings: ContractorListing[],
  searchTrade: TradeSlug | null | undefined
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const l of listings) {
    if (l.mapPinKind !== "precise") continue;
    const f = contractorPointFeature(l, searchTrade);
    if (f) features.push(f);
  }
  return { type: "FeatureCollection", features };
}

function listingsToApproxGeoJSON(
  listings: ContractorListing[],
  searchTrade: TradeSlug | null | undefined
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const l of listings) {
    if (l.mapPinKind !== "approximate") continue;
    const f = contractorPointFeature(l, searchTrade);
    if (f) features.push(f);
  }
  return { type: "FeatureCollection", features };
}

function pinSourceForRow(row: ContractorListing | undefined): typeof SOURCE_PRECISE | typeof SOURCE_APPROX | null {
  if (!row?.mapPinKind) return null;
  return row.mapPinKind === "approximate" ? SOURCE_APPROX : SOURCE_PRECISE;
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

async function rasterizeLucideIcon(Icon: LucideIcon, strokeHex: string): Promise<ImageData> {
  const markup = renderToStaticMarkup(
    createElement(Icon, {
      size: ICON_RASTER_PX,
      color: strokeHex,
      stroke: strokeHex,
      fill: "none",
      strokeWidth: 2.1,
      "aria-hidden": true,
    })
  );
  return svgToImageData(markup, ICON_RASTER_PX);
}

async function ensureTradeIconImages(map: mapboxgl.Map): Promise<void> {
  for (let ord = 0; ord < TRADE_PALETTE_ORDER.length; ord++) {
    const id = iconIdForOrdinal(ord);
    if (map.hasImage(id)) continue;
    const key = TRADE_PALETTE_ORDER[ord];
    const Icon = TRADE_COLORS[key].icon;
    const label = TRADE_COLORS[key].label;
    const hex = getTradeIconHex(label);
    const data = await rasterizeLucideIcon(Icon, hex);
    map.addImage(id, data, { pixelRatio: 1 });
  }
  if (!map.hasImage("trade-icon-default")) {
    const hex = getTradeIconHex(null);
    const data = await rasterizeLucideIcon(DEFAULT_TRADE.icon, hex);
    map.addImage("trade-icon-default", data, { pixelRatio: 1 });
  }
}

const hoverOrList: mapboxgl.ExpressionSpecification = [
  "any",
  ["boolean", ["feature-state", "hover"], false],
  ["boolean", ["feature-state", "listHover"], false],
] as mapboxgl.ExpressionSpecification;

/** ~12% smaller than prior defaults for calmer density. */
const radiusExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  9.25,
  hoverOrList,
  9,
  7.75,
] as mapboxgl.ExpressionSpecification;

/** Single outer ring: thin default, slightly stronger hover, brand when selected. */
const strokeWidthExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  2.5,
  hoverOrList,
  2.1,
  1.75,
] as mapboxgl.ExpressionSpecification;

const strokeColorExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  BRAND_SELECTION_HEX,
  ["get", "trade_hex"],
] as mapboxgl.ExpressionSpecification;

const shadowRadiusExpr: mapboxgl.ExpressionSpecification = [
  "+",
  radiusExpr,
  1.15,
] as mapboxgl.ExpressionSpecification;

/** Stronger shadow on hover (circle-translate must stay literal on circles). */
const shadowColorExpr: mapboxgl.ExpressionSpecification = [
  "case",
  hoverOrList,
  "rgba(15, 23, 42, 0.18)",
  "rgba(15, 23, 42, 0.09)",
] as mapboxgl.ExpressionSpecification;

/** Smaller, softer pins for city/zip “approximate” geocodes (separate unclustered source). */
const approxRadiusExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  7.75,
  hoverOrList,
  7.25,
  6.75,
] as mapboxgl.ExpressionSpecification;

const approxShadowRadiusExpr: mapboxgl.ExpressionSpecification = [
  "+",
  approxRadiusExpr,
  1,
] as mapboxgl.ExpressionSpecification;

const approxStrokeWidthExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  2.2,
  hoverOrList,
  1.85,
  1.55,
] as mapboxgl.ExpressionSpecification;

const approxMainOpacityExpr: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false],
  0.9,
  hoverOrList,
  0.78,
  0.58,
] as mapboxgl.ExpressionSpecification;

const approxShadowOpacityExpr: mapboxgl.ExpressionSpecification = [
  "case",
  hoverOrList,
  "rgba(15, 23, 42, 0.12)",
  "rgba(15, 23, 42, 0.06)",
] as mapboxgl.ExpressionSpecification;

export default function ContractorMap({
  listings,
  highlightedId,
  selectedId,
  onBoundsChange,
  onMarkerHover,
  onMarkerSelect,
  searchTrade = null,
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
  const searchTradeRef = useRef(searchTrade);
  searchTradeRef.current = searchTrade;

  const hoverPinIdRef = useRef<string | null>(null);
  const hoverPinSourceRef = useRef<string | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const prevSelectedForStateRef = useRef<string | null>(null);
  const prevSelectedSourceRef = useRef<string | null>(null);
  const prevHighlightForStateRef = useRef<string | null>(null);
  const prevHighlightSourceRef = useRef<string | null>(null);

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
      const props = feature.properties as Record<string, string | number> | null;
      if (!props) return;
      const geom = feature.geometry;
      if (geom.type !== "Point") return;
      const [lng, lat] = geom.coordinates;

      const isApprox =
        props.is_approximate === 1 ||
        props.is_approximate === "1" ||
        Number(props.is_approximate) === 1;

      popupTimerRef.current = setTimeout(() => {
        const tradeLine = [props.trade_label, props.city].filter(Boolean).join(" · ");
        const approxLine = isApprox
          ? `<div class="contractor-pin-popup-approx">Approximate location</div>`
          : "";
        popup
          .setLngLat([lng, lat])
          .setHTML(
            `<div class="contractor-pin-popup-inner">` +
              `<div class="contractor-pin-popup-name">${escapeHtml(String(props.business_name ?? ""))}</div>` +
              approxLine +
              `<div class="contractor-pin-popup-meta">${escapeHtml(String(tradeLine))}</div>` +
              `</div>`
          )
          .addTo(map);
      }, 100);
    };

    const setHoverPin = (
      nextId: string | null,
      nextSource: string | null,
      feature?: mapboxgl.MapboxGeoJSONFeature
    ) => {
      if (
        nextId !== null &&
        hoverPinIdRef.current === nextId &&
        hoverPinSourceRef.current === nextSource
      ) {
        return;
      }
      if (hoverPinIdRef.current && hoverPinSourceRef.current) {
        map.removeFeatureState(
          { source: hoverPinSourceRef.current, id: hoverPinIdRef.current },
          "hover"
        );
      }
      hoverPinIdRef.current = nextId;
      hoverPinSourceRef.current = nextSource;
      if (nextId && nextSource) {
        map.setFeatureState({ source: nextSource, id: nextId }, { hover: true });
        onMarkerHoverRef.current(nextId);
        if (feature) schedulePopup(feature);
      } else {
        onMarkerHoverRef.current(null);
        hidePopup();
      }
    };

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, {
        layers: [...PIN_HOVER_LAYERS],
      });
      const top = feats[0];
      const nextId =
        top && top.id != null ? String(top.id) : (top?.properties?.license_number as string | undefined) ?? null;
      const nextSource = (top?.source as string | undefined) ?? null;

      if (nextId && nextSource) {
        map.getCanvas().style.cursor = "pointer";
        setHoverPin(nextId, nextSource, top);
      } else {
        map.getCanvas().style.cursor = "";
        setHoverPin(null, null);
      }
    };

    const onMouseLeaveCanvas = () => {
      map.getCanvas().style.cursor = "";
      setHoverPin(null, null);
    };

    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      const clusterHits = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTER] });
      if (clusterHits.length > 0) {
        const hit = clusterHits[0];
        const clId = hit.properties?.cluster_id;
        const src = map.getSource(SOURCE_PRECISE) as mapboxgl.GeoJSONSource;
        const coords = (hit.geometry as GeoJSON.Point).coordinates as [number, number];
        if (clId != null && typeof src.getClusterExpansionZoom === "function") {
          src.getClusterExpansionZoom(Number(clId), (err, zoom) => {
            if (err || zoom == null) return;
            const cur = map.getZoom();
            // Always move at least half a zoom in — avoids a no-op when
            // expansion zoom equals current zoom (cluster never “opens”).
            const target = Math.min(18, Math.max(zoom, cur + 0.5));
            map.easeTo({ center: coords, zoom: target });
          });
        }
        return;
      }

      const pinHits = map.queryRenderedFeatures(e.point, {
        layers: [...PIN_HOVER_LAYERS],
      });
      if (pinHits.length > 0) {
        const id = String(pinHits[0].id ?? pinHits[0].properties?.license_number);
        onMarkerSelectRef.current(id);
        return;
      }

      onClearSelectionRef.current?.();
    };

    const unclusteredFilter: mapboxgl.ExpressionSpecification = [
      "!",
      ["has", "point_count"],
    ] as mapboxgl.ExpressionSpecification;

    map.on("load", () => {
      void (async () => {
        try {
          await ensureTradeIconImages(map);
        } catch (err) {
          console.error("ContractorMap: failed to load trade icons", err);
          return;
        }
        if (cancelled || !mapRef.current) return;

        map.addSource(SOURCE_PRECISE, {
          type: "geojson",
          data: listingsToPreciseGeoJSON(listingsRef.current, searchTradeRef.current),
          cluster: true,
          clusterRadius: 50,
          /**
           * Stop clustering above this zoom so individual trade markers
           * appear at the default peninsula zoom (~11.6). Mapbox default
           * is 14 — with mock city+jitter coords that left users stuck on
           * gray count bubbles until zoomed far past street level.
           */
          clusterMaxZoom: 11,
          clusterProperties: {
            min_ord: ["min", ["get", "trade_ord"]],
            max_ord: ["max", ["get", "trade_ord"]],
          },
        });

        map.addLayer({
          id: LAYER_CLUSTER,
          type: "circle",
          source: SOURCE_PRECISE,
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
          source: SOURCE_PRECISE,
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
          id: LAYER_UNCLUSTERED_SHADOW,
          type: "circle",
          source: SOURCE_PRECISE,
          filter: unclusteredFilter,
          paint: {
            "circle-radius": shadowRadiusExpr,
            "circle-color": shadowColorExpr,
            // Mapbox does not allow data/feature-state expressions on circle-translate.
            "circle-translate": [0, 1.5],
            "circle-opacity": 0.85,
          },
        });

        map.addLayer({
          id: LAYER_UNCLUSTERED_MAIN,
          type: "circle",
          source: SOURCE_PRECISE,
          filter: unclusteredFilter,
          paint: {
            "circle-radius": radiusExpr,
            "circle-color": "#ffffff",
            "circle-stroke-width": strokeWidthExpr,
            "circle-stroke-color": strokeColorExpr,
            "circle-translate": [0, 0],
            "circle-opacity": 1,
          },
        });

        map.addLayer({
          id: LAYER_UNCLUSTERED_ICON,
          type: "symbol",
          source: SOURCE_PRECISE,
          filter: unclusteredFilter,
          layout: {
            "icon-image": ["get", "icon_id"],
            // `icon-size` is layout-only: no feature-state. `icon-translate` paint cannot be
            // data-driven either — default (0,0). Size ≈ prior ~8.5px on 20px raster.
            "icon-size": 0.46,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });

        map.addLayer({
          id: LAYER_UNCLUSTERED_ISSUE,
          type: "circle",
          source: SOURCE_PRECISE,
          filter: ["all", unclusteredFilter, ["==", ["get", "has_issue"], 1]],
          paint: {
            "circle-radius": 2.5,
            "circle-color": "#f59e0b",
            "circle-stroke-width": 1.15,
            "circle-stroke-color": "#ffffff",
            "circle-translate": [5.5, 4],
            "circle-opacity": 0.92,
          },
        });

        map.addSource(SOURCE_APPROX, {
          type: "geojson",
          data: listingsToApproxGeoJSON(listingsRef.current, searchTradeRef.current),
          cluster: false,
        });

        map.addLayer({
          id: LAYER_APPROX_SHADOW,
          type: "circle",
          source: SOURCE_APPROX,
          paint: {
            "circle-radius": approxShadowRadiusExpr,
            "circle-color": approxShadowOpacityExpr,
            "circle-translate": [0, 1.25],
            "circle-opacity": 0.75,
          },
        });

        map.addLayer({
          id: LAYER_APPROX_MAIN,
          type: "circle",
          source: SOURCE_APPROX,
          paint: {
            "circle-radius": approxRadiusExpr,
            "circle-color": "#ffffff",
            "circle-stroke-width": approxStrokeWidthExpr,
            "circle-stroke-color": strokeColorExpr,
            "circle-opacity": approxMainOpacityExpr,
          },
        });

        map.addLayer({
          id: LAYER_APPROX_ICON,
          type: "symbol",
          source: SOURCE_APPROX,
          layout: {
            "icon-image": ["get", "icon_id"],
            "icon-size": 0.42,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
          paint: {
            "icon-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.88,
              hoverOrList,
              0.78,
              0.58,
            ] as mapboxgl.ExpressionSpecification,
          },
        });

        map.addLayer({
          id: LAYER_APPROX_ISSUE,
          type: "circle",
          source: SOURCE_APPROX,
          filter: ["==", ["get", "has_issue"], 1],
          paint: {
            "circle-radius": 2.25,
            "circle-color": "#f59e0b",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-translate": [5, 3.5],
            "circle-opacity": 0.85,
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
      hoverPinSourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const srcP = map.getSource(SOURCE_PRECISE) as mapboxgl.GeoJSONSource | undefined;
    const srcA = map.getSource(SOURCE_APPROX) as mapboxgl.GeoJSONSource | undefined;
    if (!srcP || !srcA) return;
    srcP.setData(listingsToPreciseGeoJSON(listings, searchTrade));
    srcA.setData(listingsToApproxGeoJSON(listings, searchTrade));
  }, [listings, searchTrade]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (!map.getSource(SOURCE_PRECISE)) return;

    const prev = prevSelectedForStateRef.current;
    const prevSrc = prevSelectedSourceRef.current;
    if (prev && prevSrc && prev !== selectedId) {
      map.removeFeatureState({ source: prevSrc, id: prev }, "selected");
    }
    if (selectedId) {
      const row = listings.find((l) => l.license_number === selectedId);
      const src = pinSourceForRow(row);
      if (src) {
        map.setFeatureState({ source: src, id: selectedId }, { selected: true });
        prevSelectedSourceRef.current = src;
      } else {
        prevSelectedSourceRef.current = null;
      }
    } else {
      prevSelectedSourceRef.current = null;
    }
    prevSelectedForStateRef.current = selectedId;
  }, [selectedId, listings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (!map.getSource(SOURCE_PRECISE)) return;

    const prev = prevHighlightForStateRef.current;
    const prevSrc = prevHighlightSourceRef.current;
    if (prev && prevSrc && prev !== highlightedId) {
      map.removeFeatureState({ source: prevSrc, id: prev }, "listHover");
    }
    if (highlightedId) {
      const row = listings.find((l) => l.license_number === highlightedId);
      const src = pinSourceForRow(row);
      if (src) {
        map.setFeatureState({ source: src, id: highlightedId }, { listHover: true });
        prevHighlightSourceRef.current = src;
      } else {
        prevHighlightSourceRef.current = null;
      }
    } else {
      prevHighlightSourceRef.current = null;
    }
    prevHighlightForStateRef.current = highlightedId;
  }, [highlightedId, listings]);

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
