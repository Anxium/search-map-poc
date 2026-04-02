"use client";

import { useEffect, useRef, useCallback } from "react";
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
import { formatPrice } from "@/lib/format";

const WI_LOGO_PATH =
  "m64.42 46.92-39.59-25.66c-5.26 11.46-7.96 23.94-7.96 36.39.01 12.08 2.58 24.14 7.86 35.21l66.12-42.96 75.27-48.8c1.62-1.05 3.39-1.35 5.25-.9 1.86.43 3.31 1.51 4.29 3.15l.88 1.48c9.47 16.06 14.37 34.45 14.36 52.81 0 18-4.73 35.99-14.52 51.72l-.89 1.43c-1 1.61-2.44 2.62-4.29 3.04-1.85.4-3.59.1-5.16-.93l-55.09-35.8 15.5-10.05 39.72 25.8c5.28-11.07 7.86-23.14 7.86-35.21.02-12.45-2.7-24.93-7.96-36.39l-47.59 30.85-15.69 10.17-77.92 50.64c-1.59 1.03-3.33 1.33-5.18.93-1.85-.42-3.28-1.44-4.29-3.04l-.89-1.43c-9.76-15.74-14.49-33.72-14.51-51.72-.01-18.36 4.91-36.75 14.37-52.82l.88-1.48c.97-1.65 2.41-2.73 4.27-3.15 1.88-.45 3.64-.14 5.25.9l55.15 35.74-15.51 10.07z";

const ICON_W = 28;
const ICON_H = Math.round(ICON_W * (114.02 / 190.89));

function buildIconHtml(color: string, active = false) {
  const cls = active ? ` class="marker-active"` : "";
  return `<div${cls} style="width:${ICON_W}px;height:${ICON_H}px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));">
    <svg viewBox="0 0 190.89 114.02" xmlns="http://www.w3.org/2000/svg" fill="${color}" style="width:100%;height:100%;">
      <path d="${WI_LOGO_PATH}"/>
    </svg>
  </div>`;
}

const ICON_DEFAULT = L.divIcon({
  className: "we-marker",
  html: buildIconHtml("#26e0e5"),
  iconSize: [ICON_W, ICON_H],
  iconAnchor: [ICON_W / 2, ICON_H / 2],
  popupAnchor: [0, -ICON_H / 2 - 8],
});

const ICON_ACTIVE = L.divIcon({
  className: "we-marker",
  html: buildIconHtml("#f97316", true),
  iconSize: [ICON_W, ICON_H],
  iconAnchor: [ICON_W / 2, ICON_H / 2],
  popupAnchor: [0, -ICON_H / 2 - 8],
});

const CLUSTER_SVG = `<svg viewBox="0 0 190.89 114.02" xmlns="http://www.w3.org/2000/svg" fill="#26e0e5" style="width:18px;height:11px;flex-shrink:0;"><path d="${WI_LOGO_PATH}"/></svg>`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  const label = `${count} properties`;
  const estimatedWidth = 16 + 6 + label.length * 7 + 16;

  return L.divIcon({
    className: "we-cluster",
    html: `<div style="display:inline-flex;align-items:center;gap:4px;background:#cefafb;border:1px solid #65ecf0;border-radius:6px;padding:4px 8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#194f5f;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.12);line-height:16px;">
      ${CLUSTER_SVG}
      ${label}
    </div>`,
    iconSize: [estimatedWidth, 26],
    iconAnchor: [estimatedWidth / 2, 13],
  });
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
}: {
  properties: Property[];
  activePropertyId: number | null;
  selectionSource: "list" | "map" | null;
  selectionKey: number;
  markerRefs: React.RefObject<Record<number, L.Marker | null>>;
  onDeselect: () => void;
  onInitialBounds: (b: Bounds) => void;
  onUserMoved: (b: Bounds) => void;
}) {
  const map = useMap();
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
      refs[prev]!.setIcon(ICON_DEFAULT);
      refs[prev]!.setZIndexOffset(0);
    }
    if (activePropertyId !== null && refs?.[activePropertyId]) {
      refs[activePropertyId]!.setIcon(ICON_ACTIVE);
      refs[activePropertyId]!.setZIndexOffset(10000);
    }
    prevActiveRef.current = activePropertyId;
  }, [activePropertyId, markerRefs]);

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
  const type = t[property.type];
  const price = formatPrice(property.price) + (property.transaction === "rent" ? t.perMonth : "");

  return (
    <Popup className="property-popup" closeButton={false} maxWidth={320} minWidth={280} autoPan={false}>
      <div style={{ width: 280, background: "white", fontFamily: "Inter, sans-serif" }}>
        <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden" }}>
          <img src={property.images[0]} alt={type} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, alignItems: "center" }}>
            {property.images.slice(0, 5).map((_, i) => (
              <span key={i} style={{ width: i === 0 ? 8 : 10, height: i === 0 ? 8 : 10, borderRadius: 5, background: i === 0 ? "#26e0e5" : "#e5e7eb", display: "block" }} />
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                {property.bedrooms} {t.bedrooms}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              {property.surface} m²
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 14, fontWeight: 500, color: "#6b7280", lineHeight: "20px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 2 }}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
}: MapProps) {
  const markerRefs = useRef<Record<number, L.Marker | null>>({});
  const setMarkerRef = useCallback((id: number, ref: L.Marker | null) => {
    markerRefs.current[id] = ref;
  }, []);

  const handleDeselect = useCallback(() => onDeselect?.(), [onDeselect]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "8px 32px 32px 8px" }}>
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
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          iconCreateFunction={createClusterIcon}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {properties.map((property) => (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              icon={property.id === activePropertyId ? ICON_ACTIVE : ICON_DEFAULT}
              ref={(ref) => setMarkerRef(property.id, ref)}
              zIndexOffset={property.id === activePropertyId ? 10000 : 0}
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
