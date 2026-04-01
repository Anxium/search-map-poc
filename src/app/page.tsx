"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { properties, Property, TransactionType, Bounds, getPriceRange, filterByBounds } from "@/data/properties";
import { Locale, translations } from "@/data/i18n";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import { ChevronDownIcon } from "@/components/Icons";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [viewMode, setViewMode] = useState<"list" | "hybrid" | "map">("hybrid");
  const [activePropertyId, setActivePropertyId] = useState<number | null>(null);
  const [selectionSource, setSelectionSource] = useState<"list" | "map" | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);

  const selectProperty = useCallback((id: number | null, source: "list" | "map") => {
    setSelectionSource(id ? source : null);
    setActivePropertyId(id);
    if (id !== null) setSelectionKey((k) => k + 1);
  }, []);

  // Filters
  const [transactionType, setTransactionType] = useState<TransactionType>("buy");
  const [selectedTypes, setSelectedTypes] = useState<Property["type"][]>([]);
  const [minBedrooms, setMinBedrooms] = useState(0);

  const priceRange = getPriceRange(transactionType);
  const [minPrice, setMinPrice] = useState(priceRange.min);
  const [maxPrice, setMaxPrice] = useState(priceRange.max);

  function handleTransactionChange(type: TransactionType) {
    setTransactionType(type);
    const range = getPriceRange(type);
    setMinPrice(range.min);
    setMaxPrice(range.max);
    setActivePropertyId(null);
  }

  // Viewport bounds: two-phase loading
  const [activeBounds, setActiveBounds] = useState<Bounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<Bounds | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  // Called once after geolocation resolves/fails/times out
  const handleInitialBounds = useCallback((bounds: Bounds) => {
    setActiveBounds(bounds);
    setPendingBounds(bounds);
  }, []);

  // Called on subsequent pans/zooms (only after initial load)
  const handleUserMoved = useCallback((bounds: Bounds) => {
    setPendingBounds(bounds);
    setHasMoved(true);
  }, []);

  const handleSearchThisArea = useCallback(() => {
    setActiveBounds(pendingBounds);
    setHasMoved(false);
    setActivePropertyId(null);
  }, [pendingBounds]);

  const t = translations[locale];

  const filtered = useMemo(() => {
    const base = activeBounds ? filterByBounds(properties, activeBounds) : properties;
    return base.filter((p) => {
      if (p.transaction !== transactionType) return false;
      if (p.price < minPrice || p.price > maxPrice) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
      if (p.bedrooms < minBedrooms) return false;
      return true;
    });
  }, [activeBounds, transactionType, minPrice, maxPrice, selectedTypes, minBedrooms]);

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!activePropertyId) return;
    const el = cardRefs.current[activePropertyId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activePropertyId]);

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column", background: "#f9fafb" }}>
      <SearchBar
        locale={locale}
        onLocaleChange={setLocale}
        t={t}
        transactionType={transactionType}
        onTransactionTypeChange={handleTransactionChange}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={setSelectedTypes}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceRangeMin={priceRange.min}
        priceRangeMax={priceRange.max}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        minBedrooms={minBedrooms}
        onMinBedroomsChange={setMinBedrooms}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {viewMode !== "map" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              gap: 16,
              padding: "16px 0",
              ...(viewMode === "list"
                ? { flex: 1, paddingLeft: 32, paddingRight: 32 }
                : { width: 600, flexShrink: 0, paddingLeft: 32, paddingRight: 16 }),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#4b5563" }}>
                {filtered.length} {t.results}
              </p>
              <div style={{ background: "white", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{t.relevance}</span>
                <ChevronDownIcon />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                ...(viewMode === "list"
                  ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 16 }
                  : { display: "flex", flexDirection: "column", gap: 16 }),
              }}
            >
              {filtered.map((property) => (
                <div
                  key={property.id}
                  ref={(el) => {
                    if (el) cardRefs.current[property.id] = el;
                    else delete cardRefs.current[property.id];
                  }}
                >
                  <PropertyCard
                    property={property}
                    t={t}
                    isActive={property.id === activePropertyId}
                    onClick={() =>
                      selectProperty(
                        activePropertyId === property.id ? null : property.id,
                        "list",
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode !== "list" && (
          <div style={{ flex: 1, padding: "16px 32px 16px 0" }}>
            <Map
              properties={filtered}
              locale={locale}
              t={t}
              activePropertyId={activePropertyId}
              selectionSource={selectionSource}
              selectionKey={selectionKey}
              onMarkerClick={(id) =>
                selectProperty(activePropertyId === id ? null : id, "map")
              }
              onDeselect={() => selectProperty(null, "map")}
              onInitialBounds={handleInitialBounds}
              onUserMoved={handleUserMoved}
              showSearchButton={hasMoved}
              onSearchThisArea={handleSearchThisArea}
            />
          </div>
        )}
      </div>
    </div>
  );
}
