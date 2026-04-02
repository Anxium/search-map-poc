"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Property, Bounds } from "@/data/properties";
import { Locale, Translations } from "@/data/i18n";
import { formatPrice, formatShortPrice } from "@/lib/format";

// Tabler icon SVG paths (14px, stroke 1.5) for inline use in Leaflet markers
const TYPE_ICONS: Record<Property["type"], string> = {
  house: '<path d="M5 12l-2 0l9 -9l9 9l-2 0"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>',
  apartment: '<path d="M3 21l18 0"/><path d="M5 21v-14l8 -4v18"/><path d="M19 21v-10l-6 -4"/><path d="M9 9l0 .01"/><path d="M9 12l0 .01"/><path d="M9 15l0 .01"/><path d="M9 18l0 .01"/>',
  studio: '<path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/>',
};

function typeIconSvg(type: Property["type"], color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TYPE_ICONS[type]}</svg>`;
}

// Price range colors: green→teal→blue→purple
function priceColor(price: number, isRent: boolean): { bg: string; border: string; text: string } {
  const threshold = isRent
    ? [800, 1200, 1800] // rent thresholds
    : [250000, 400000, 600000]; // buy thresholds

  if (price <= threshold[0]) return { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46" }; // green — affordable
  if (price <= threshold[1]) return { bg: "#e9fcfc", border: "#26e0e5", text: "#115e59" }; // teal — mid
  if (price <= threshold[2]) return { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" }; // blue — upper
  return { bg: "#faf5ff", border: "#c4b5fd", text: "#5b21b6" }; // purple — premium
}

function createPropertyIcon(property: Property, active: boolean) {
  const label = formatShortPrice(property.price);
  const colors = active
    ? { bg: "#172C40", border: "#172C40", text: "#ffffff" }
    : priceColor(property.price, property.transaction === "rent");
  const cls = active ? ` class="marker-active"` : "";
  const estimatedWidth = 14 + 4 + label.length * 7 + 20;

  return L.divIcon({
    className: "we-marker",
    html: `<div${cls} style="display:inline-flex;align-items:center;gap:4px;background:${colors.bg};border:1.5px solid ${colors.border};border-radius:20px;padding:3px 8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:${colors.text};white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);line-height:16px;cursor:pointer;">
      ${typeIconSvg(property.type, colors.text)}
      ${label}
    </div>`,
    iconSize: [estimatedWidth, 26],
    iconAnchor: [estimatedWidth / 2, 13],
    popupAnchor: [0, -18],
  });
}

function makeClusterIconFn(propertiesLabel: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (cluster: any) => {
    const count = cluster.getChildCount();
    const label = `${count} ${propertiesLabel}`;
    const estimatedWidth = 14 + 4 + label.length * 7 + 20;

    return L.divIcon({
      className: "we-cluster",
      html: `<div style="display:inline-flex;align-items:center;gap:4px;background:#fff;border:1.5px solid #1892A2;border-radius:20px;padding:3px 8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#172C40;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);line-height:16px;" role="img" aria-label="${label}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1892A2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"/><path d="M9 4v13"/><path d="M15 7v13"/></svg>
        ${label}
      </div>`,
      iconSize: [estimatedWidth, 26],
      iconAnchor: [estimatedWidth / 2, 13],
    });
  };
}

function toBounds(b: L.LatLngBounds): Bounds {
  return { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() };
}

const BELGIUM_BOUNDS = L.latLngBounds([49.4, 2.3], [51.6, 6.5]);

// Repositions marker to bottom-center of viewport so popup has room above
function panToMarkerBottomCenter(map: L.Map, lat: number, lng: number, zoom: number) {
  const containerHeight = map.getContainer().clientHeight;
  const markerPoint = map.project([lat, lng], zoom);
  const centerPoint = L.point(markerPoint.x, markerPoint.y - containerHeight * 0.35);
  return map.unproject(centerPoint, zoom);
}

function MapInternals({
  properties,
  activePropertyId,
  selectionSource,
  selectionKey,
  markerRefs,
  onDeselect,
  onInitialBounds,
  onUserMoved,
  fullscreen,
  viewMode,
}: {
  properties: Property[];
  activePropertyId: number | null;
  selectionSource: "list" | "map" | null;
  selectionKey: number;
  markerRefs: React.RefObject<Record<number, L.Marker | null>>;
  onDeselect: () => void;
  onInitialBounds: (b: Bounds) => void;
  onUserMoved: (b: Bounds) => void;
  fullscreen: boolean;
  viewMode: string;
}) {
  const map = useMap();

  const prevViewModeRef = useRef(viewMode);
  useEffect(() => {
    const changed = prevViewModeRef.current !== viewMode;
    prevViewModeRef.current = viewMode;

    setTimeout(() => {
      map.invalidateSize();
      if (changed && activePropertyId) {
        const property = properties.find((p) => p.id === activePropertyId);
        if (property) {
          ignoreUntil.current = Date.now() + 1500;
          const currentZoom = Math.max(map.getZoom(), 14);
          const center = panToMarkerBottomCenter(map, property.lat, property.lng, currentZoom);
          map.setView(center, currentZoom, { animate: false });
          setTimeout(() => {
            const marker = markerRefs.current?.[property.id];
            if (marker) marker.openPopup();
          }, 200);
        }
      }
    }, 150);
  }, [viewMode, map, activePropertyId, properties, markerRefs]);
  const prevActiveRef = useRef<number | null>(null);
  const ignoreUntil = useRef(0);
  const initialized = useRef(false);

  const onInitRef = useRef(onInitialBounds);
  const onMovedRef = useRef(onUserMoved);
  onInitRef.current = onInitialBounds;
  onMovedRef.current = onUserMoved;

  // 1. Geolocation + initial bounds
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    function done() {
      onInitRef.current(toBounds(map.getBounds()));
    }

    if (!navigator.geolocation) { done(); return; }

    ignoreUntil.current = Date.now() + 1500;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13, { animate: false });
        setTimeout(done, 200);
      },
      () => setTimeout(done, 100),
      { timeout: 5000 },
    );

    const fallback = setTimeout(done, 6000);
    return () => clearTimeout(fallback);
  }, [map]);

  // 2. Listen to moveend for user pans
  useEffect(() => {
    const handler = () => {
      if (Date.now() < ignoreUntil.current) return;
      onMovedRef.current(toBounds(map.getBounds()));
    };
    map.on("moveend", handler);
    return () => { map.off("moveend", handler); };
  }, [map]);

  // 3. Update marker icons
  useEffect(() => {
    const prev = prevActiveRef.current;
    const refs = markerRefs.current;
    if (prev !== null && refs?.[prev]) {
      const prevProp = properties.find((p) => p.id === prev);
      if (prevProp) refs[prev]!.setIcon(createPropertyIcon(prevProp, false));
      refs[prev]!.setZIndexOffset(0);
    }
    if (activePropertyId !== null && refs?.[activePropertyId]) {
      const activeProp = properties.find((p) => p.id === activePropertyId);
      if (activeProp) refs[activePropertyId]!.setIcon(createPropertyIcon(activeProp, true));
      refs[activePropertyId]!.setZIndexOffset(10000);
    }
    prevActiveRef.current = activePropertyId;
  }, [activePropertyId, markerRefs, properties]);

  // 4. Handle popup open + pan on selection
  useEffect(() => {
    map.closePopup();
    if (!activePropertyId) return;

    const property = properties.find((p) => p.id === activePropertyId);
    if (!property) return;

    if (selectionSource === "list") {
      ignoreUntil.current = Date.now() + 2000;
      const targetZoom = 16;
      const center = panToMarkerBottomCenter(map, property.lat, property.lng, targetZoom);
      map.setView(center, targetZoom, { animate: true, duration: 0.5 });
      const timer = setTimeout(() => {
        const marker = markerRefs.current?.[property.id];
        if (marker) marker.openPopup();
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // Map click: reposition marker to bottom-center too
      ignoreUntil.current = Date.now() + 1500;
      const currentZoom = Math.max(map.getZoom(), 14);
      const center = panToMarkerBottomCenter(map, property.lat, property.lng, currentZoom);
      map.setView(center, currentZoom, { animate: true, duration: 0.3 });
      const timer = setTimeout(() => {
        const marker = markerRefs.current?.[property.id];
        if (marker) marker.openPopup();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activePropertyId, selectionKey, properties, map, markerRefs, selectionSource]);

  useMapEvents({ click: () => onDeselect() });

  return null;
}

function PropertyPopup({ property, t }: { property: Property; t: Translations }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const type = t[property.type];
  const price = formatPrice(property.price) + (property.transaction === "rent" ? t.perMonth : "");
  const totalPhotos = property.images.length;

  return (
    <Popup className="property-popup" closeButton={false} maxWidth={320} minWidth={280} autoPan={false}>
      <div style={{ width: 280, background: "white", fontFamily: "Inter, sans-serif" }}>
        <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden" }}>
          <img src={property.images[photoIdx]} alt={`${type} - ${property.address}, ${property.postalCode}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.2s" }} />
          {/* Prev/Next click zones with light chevron indicators */}
          <div
            onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => (i - 1 + totalPhotos) % totalPhotos); }}
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", cursor: "pointer", display: "flex", alignItems: "center", paddingLeft: 6 }}
            aria-label={t.previousPhoto}
            role="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))", opacity: 0.8 }} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => (i + 1) % totalPhotos); }}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}
            aria-label={t.nextPhoto}
            role="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))", opacity: 0.8 }} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
          {/* Dot indicators — clickable */}
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, alignItems: "center" }}>
            {property.images.slice(0, 6).map((_, i) => (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                style={{ width: i === photoIdx ? 10 : 7, height: i === photoIdx ? 10 : 7, borderRadius: 5, background: i === photoIdx ? "#26e0e5" : "rgba(255,255,255,0.6)", display: "block", cursor: "pointer", transition: "all 0.15s" }}
              />
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", lineHeight: "20px" }}>{type}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: "28px" }}>{price}</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 14, fontWeight: 500, color: "#6b7280", lineHeight: "16px" }}>
            {property.bedrooms > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" aria-hidden="true"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                {property.bedrooms} {t.bedrooms}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" aria-hidden="true"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              {property.surface} m²
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 14, fontWeight: 500, color: "#6b7280", lineHeight: "20px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div>
              <div style={{ margin: 0 }}>{property.address}</div>
              <div style={{ margin: 0 }}>{property.postalCode}</div>
            </div>
          </div>
        </div>
      </div>
    </Popup>
  );
}

interface MapProps {
  properties: Property[];
  locale: Locale;
  t: Translations;
  activePropertyId?: number | null;
  selectionSource?: "list" | "map" | null;
  selectionKey?: number;
  onMarkerClick?: (id: number) => void;
  onDeselect?: () => void;
  onInitialBounds?: (bounds: Bounds) => void;
  onUserMoved?: (bounds: Bounds) => void;
  fullscreen?: boolean;
  viewMode?: string;
}

export default function Map({
  properties,
  locale,
  t,
  activePropertyId,
  selectionSource,
  selectionKey,
  onMarkerClick,
  onDeselect,
  onInitialBounds,
  onUserMoved,
  fullscreen,
  viewMode,
}: MapProps) {
  const markerRefs = useRef<Record<number, L.Marker | null>>({});
  const setMarkerRef = useCallback((id: number, ref: L.Marker | null) => {
    markerRefs.current[id] = ref;
  }, []);

  const handleDeselect = useCallback(() => onDeselect?.(), [onDeselect]);

  return (
    <div role="region" aria-label="Property map" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: fullscreen ? 0 : "8px 32px 32px 8px" }}>
      <MapContainer
        key={locale}
        center={[50.5, 4.5]}
        zoom={8}
        minZoom={7}
        maxBounds={BELGIUM_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ position: "absolute", inset: 0 }}
        zoomControl={false}
      >
        <MapInternals
          properties={properties}
          activePropertyId={activePropertyId ?? null}
          selectionSource={selectionSource ?? null}
          selectionKey={selectionKey ?? 0}
          markerRefs={markerRefs}
          onDeselect={handleDeselect}
          onInitialBounds={onInitialBounds ?? (() => {})}
          onUserMoved={onUserMoved ?? (() => {})}
          fullscreen={!!fullscreen}
          viewMode={viewMode ?? "hybrid"}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          iconCreateFunction={makeClusterIconFn(t.properties)}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {properties.map((property, index) => (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              icon={createPropertyIcon(property, property.id === activePropertyId)}
              ref={(ref) => setMarkerRef(property.id, ref)}
              zIndexOffset={property.id === activePropertyId ? 10000 : Math.max(0, properties.length - index)}
              eventHandlers={{
                click: () => onMarkerClick?.(property.id),
              }}
            >
              <PropertyPopup property={property} t={t} />
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
