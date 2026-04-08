"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Property, TransactionType, Bounds, getPriceRange } from "@/data/properties";
import { Locale, translations } from "@/data/i18n";
import { fetchProperties, SortOption } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import { ChevronDownIcon, RefreshIcon } from "@/components/Icons";
import { Translations } from "@/data/i18n";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const SORT_OPTIONS: SortOption[] = ["relevance", "priceLowToHigh", "priceHighToLow", "surfaceLargest"];

function SortOptionButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 4, fontSize: 14, border: "none", cursor: "pointer",
        background: active ? "#1892a2" : hovered ? "#F3F4F6" : "transparent",
        color: active ? "white" : "#374151",
        fontWeight: active ? 500 : 400,
        transition: "background 0.1s",
      }}
    >
      {children}
    </button>
  );
}

function SortDropdown({ sortBy, onChange, t }: { sortBy: SortOption; onChange: (s: SortOption) => void; t: Translations }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const labels: Record<SortOption, string> = {
    relevance: t.relevance,
    priceLowToHigh: t.priceLowToHigh,
    priceHighToLow: t.priceHighToLow,
    surfaceLargest: t.surfaceLargest,
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } if (e.key === "Escape") setOpen(false); }}
        style={{ background: "white", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", cursor: "pointer", height: 38 }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{labels[sortBy]}</span>
        <ChevronDownIcon />
      </div>
      {open && (
        <div role="listbox" style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 8, zIndex: 10000, minWidth: 200 }}>
          {SORT_OPTIONS.map((opt) => (
            <SortOptionButton key={opt} active={sortBy === opt} onClick={() => { onChange(opt); setOpen(false); }}>
              {labels[opt]}
            </SortOptionButton>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchAreaButton({ enabled, loading, label, loadingLabel, onClick }: {
  enabled: boolean;
  loading: boolean;
  label: string;
  loadingLabel: string;
  onClick: () => void;
}) {
  const disabled = !enabled || loading;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
      disabled={disabled}
      style={{
        position: "absolute",
        top: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "white",
        border: "1px solid #d1d5db",
        borderRadius: 24,
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 600,
        color: disabled ? "#9CA3AF" : "#374151",
        cursor: disabled ? "default" : "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.10)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "Inter, sans-serif",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.2s, color 0.2s",
      }}
    >
      {loading ? (
        <div style={{ width: 16, height: 16, border: "2px solid #e5e7eb", borderTopColor: "#1892A2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      ) : (
        <RefreshIcon size={16} color={disabled ? "#9ca3af" : "#374151"} stroke={2} />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

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
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

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

  // Viewport bounds — pendingBounds in ref to avoid re-renders on pan
  const [activeBounds, setActiveBounds] = useState<Bounds | null>(null);
  const pendingBoundsRef = useRef<Bounds | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  // Async loading
  const [results, setResults] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const doFetch = useCallback(async (bounds: Bounds, txType: TransactionType, types: Property["type"][], pMin: number, pMax: number, beds: number, sort: SortOption) => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);

    const result = await fetchProperties({
      bounds,
      transaction: txType,
      types: types.length > 0 ? types : undefined,
      minPrice: pMin,
      maxPrice: pMax,
      minBedrooms: beds,
      sort,
    });

    if (fetchIdRef.current === id) {
      setResults(result.properties);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeBounds) return;
    doFetch(activeBounds, transactionType, selectedTypes, minPrice, maxPrice, minBedrooms, sortBy);
  }, [activeBounds, transactionType, selectedTypes, minPrice, maxPrice, minBedrooms, sortBy, doFetch]);

  const handleInitialBounds = useCallback((bounds: Bounds) => {
    pendingBoundsRef.current = bounds;
    setActiveBounds(bounds);
  }, []);

  const handleUserMoved = useCallback((bounds: Bounds) => {
    pendingBoundsRef.current = bounds;
    setHasMoved(true);
  }, []);

  const handleSearchThisArea = useCallback(() => {
    setActiveBounds(pendingBoundsRef.current);
    setHasMoved(false);
    setActivePropertyId(null);
  }, []);

  const t = translations[locale];

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!activePropertyId) return;
    // Small delay to let the list DOM render after view mode switch
    const timer = setTimeout(() => {
      const el = cardRefs.current[activePropertyId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activePropertyId, viewMode]);

  const locationMode = activeBounds ? "searchedZone" as const : "none" as const;

  return (
    <div style={{ display: "flex", height: "calc(100vh - var(--layout-nav-h))", flexDirection: "column", background: "#f9fafb", overflow: "hidden" }}>
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
        locationMode={locationMode}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - var(--layout-nav-h) - 54px)" }}>
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
              <p aria-live="polite" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563" }}>
                {isLoading ? t.loading : `${results.length} ${t.results}`}
              </p>
              <SortDropdown sortBy={sortBy} onChange={setSortBy} t={t} />
            </div>

            {isLoading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#1892A2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>{t.loading}</span>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 500, color: "#9ca3af" }}>{t.noResults}</p>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  ...(viewMode === "list"
                    ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 8 }
                    : { display: "flex", flexDirection: "column", gap: 4 }),
                }}
              >
                {results.map((property) => (
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
            )}
          </div>
        )}

        <div style={{
          flex: 1,
          padding: viewMode === "map" ? 0 : "16px 32px 16px 0",
          position: "relative",
          ...(viewMode === "list" ? { width: 0, overflow: "hidden", padding: 0, flex: "none" } : {}),
        }}>
          <Map
            properties={results}
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
            fullscreen={viewMode === "map"}
            viewMode={viewMode}
          />
          {viewMode !== "list" && (
            <SearchAreaButton
              enabled={hasMoved}
              loading={isLoading}
              label={t.searchThisArea}
              loadingLabel={t.loading}
              onClick={handleSearchThisArea}
            />
          )}
        </div>
      </div>
    </div>
  );
}
