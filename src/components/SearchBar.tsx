"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { Locale, Translations } from "@/data/i18n";
import { Property, TransactionType } from "@/data/properties";
import { formatShortPrice } from "@/lib/format";
import { ChevronDownIcon } from "@/components/Icons";

type ViewMode = "list" | "hybrid" | "map";
type PropertyType = Property["type"];

interface SearchBarProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  t: Translations;
  transactionType: TransactionType;
  onTransactionTypeChange: (type: TransactionType) => void;
  selectedTypes: PropertyType[];
  onSelectedTypesChange: (types: PropertyType[]) => void;
  minPrice: number;
  maxPrice: number;
  priceRangeMin: number;
  priceRangeMax: number;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  minBedrooms: number;
  onMinBedroomsChange: (value: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  locationMode?: "none" | "searchedZone" | "drawnZone";
}

const selectStyle: CSSProperties = {
  background: "white", border: "1px solid #d1d5db", borderRadius: 6,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", alignItems: "center",
  gap: 4, padding: "8px 12px", cursor: "pointer", fontSize: 14, whiteSpace: "nowrap",
  height: 38,
};

const optionActive: CSSProperties = {
  textAlign: "left", padding: "6px 12px", borderRadius: 4, fontSize: 14,
  border: "none", cursor: "pointer", width: "100%",
  background: "#1892a2", color: "white", fontWeight: 500,
};

const optionInactive: CSSProperties = {
  textAlign: "left", padding: "6px 12px", borderRadius: 4, fontSize: 14,
  border: "none", cursor: "pointer", width: "100%",
  background: "transparent", color: "#374151", fontWeight: 400,
};

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function Dropdown({ children, trigger, label }: { children: React.ReactNode; trigger: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div style={{ flexShrink: 0, position: "relative" }} ref={ref}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); }
          if (e.key === "Escape" && open) { setOpen(false); }
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="listbox"
          style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 12, zIndex: 10000, minWidth: 220 }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function SearchBar({
  locale, onLocaleChange, t, transactionType, onTransactionTypeChange,
  selectedTypes, onSelectedTypesChange, minPrice, maxPrice,
  priceRangeMin, priceRangeMax,
  onMinPriceChange, onMaxPriceChange, minBedrooms, onMinBedroomsChange,
  viewMode, onViewModeChange, locationMode = "none",
}: SearchBarProps) {
  const allTypes: PropertyType[] = ["apartment", "house", "studio"];
  const STEP = transactionType === "rent" ? 50 : 25000;

  function toggleType(type: PropertyType) {
    if (selectedTypes.includes(type)) {
      onSelectedTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onSelectedTypesChange([...selectedTypes, type]);
    }
  }

  const activeFilterCount =
    (minPrice > priceRangeMin || maxPrice < priceRangeMax ? 1 : 0) +
    (selectedTypes.length > 0 ? 1 : 0) +
    (minBedrooms > 0 ? 1 : 0);

  return (
    <div role="toolbar" aria-label="Search filters" style={{ background: "white", display: "flex", alignItems: "center", gap: 8, padding: "8px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)", position: "relative", zIndex: 10001 }}>
      <Dropdown label={t.buy} trigger={<div style={{ ...selectStyle, color: "#111827" }}>{transactionType === "buy" ? t.buy : t.rent} <ChevronDownIcon /></div>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(["buy", "rent"] as const).map((type) => (
            <button key={type} onClick={() => onTransactionTypeChange(type)} aria-selected={transactionType === type} role="option" style={transactionType === type ? optionActive : optionInactive}>
              {type === "buy" ? t.buy : t.rent}
            </button>
          ))}
        </div>
      </Dropdown>

      <div style={{ flexShrink: 0 }}>
        <div style={{ ...selectStyle, color: locationMode !== "none" ? "#111827" : "#6b7280" }}>
          {locationMode === "searchedZone" ? t.searchedZone : locationMode === "drawnZone" ? t.drawnZone : t.locationPlaceholder}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={locationMode !== "none" ? "#111827" : "#9ca3af"} strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </div>

      <Dropdown label={t.typePlaceholder} trigger={<div style={{ ...selectStyle, color: selectedTypes.length > 0 ? "#111827" : "#6b7280" }}>{
        selectedTypes.length === 0
          ? t.typePlaceholder
          : selectedTypes.length === allTypes.length
            ? t.allTypes
            : selectedTypes.length <= 2
              ? selectedTypes.map((st) => t[st]).join(", ")
              : `${selectedTypes.length} ${t.typesSelected}`
      } <ChevronDownIcon /></div>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {allTypes.map((type) => (
            <label key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} style={{ accentColor: "#1892a2" }} />
              <span style={{ fontSize: 14, color: "#374151" }}>{t[type]}</span>
            </label>
          ))}
        </div>
      </Dropdown>

      <Dropdown label={t.budgetPlaceholder} trigger={<div style={{ ...selectStyle, color: "#6b7280" }}>{minPrice > priceRangeMin || maxPrice < priceRangeMax ? `${formatShortPrice(minPrice)} - ${formatShortPrice(maxPrice)}` : t.budgetPlaceholder} <ChevronDownIcon /></div>}>
        <div style={{ width: 250, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 4 }}>Min</label>
            <input type="range" min={priceRangeMin} max={priceRangeMax} step={STEP} value={minPrice} onChange={(e) => onMinPriceChange(Math.min(Number(e.target.value), maxPrice))} style={{ width: "100%", accentColor: "#1892a2" }} />
            <span style={{ fontSize: 12, color: "#4b5563" }}>{formatShortPrice(minPrice)}</span>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 4 }}>Max</label>
            <input type="range" min={priceRangeMin} max={priceRangeMax} step={STEP} value={maxPrice} onChange={(e) => onMaxPriceChange(Math.max(Number(e.target.value), minPrice))} style={{ width: "100%", accentColor: "#1892a2" }} />
            <span style={{ fontSize: 12, color: "#4b5563" }}>{formatShortPrice(maxPrice)}</span>
          </div>
        </div>
      </Dropdown>

      <Dropdown label={t.bedroomsDefault} trigger={<div style={{ ...selectStyle, color: "#111827" }}>{minBedrooms === 0 ? t.bedroomsDefault : `${minBedrooms}+ ${t.bed}`} <ChevronDownIcon /></div>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => onMinBedroomsChange(n)} style={minBedrooms === n ? optionActive : optionInactive}>
              {n === 0 ? t.bedroomsDefault : `${n}+ ${t.bed}`}
            </button>
          ))}
        </div>
      </Dropdown>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <button disabled style={{ background: "#9CA3AF", color: "white", fontSize: 14, fontWeight: 600, borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", padding: "8px 12px", height: 38, display: "flex", alignItems: "center", gap: 4, border: "none", cursor: "not-allowed", opacity: 0.7 }}>
          {t.allFiltersDisabled}
        </button>
        {false && activeFilterCount > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, background: "white", border: "1px solid #9ca3af", color: "#194f5f", fontSize: 12, fontWeight: 500, borderRadius: 10, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {activeFilterCount}
          </span>
        )}
      </div>

      <div role="group" aria-label="View mode" style={{ background: "#f3f4f6", display: "flex", gap: 2, alignItems: "center", padding: 2, borderRadius: 8, flexShrink: 0, marginLeft: "auto" }}>
        {(["list", "hybrid", "map"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            aria-pressed={viewMode === mode}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer",
              border: viewMode === mode ? "1px solid #e5e7eb" : "1px solid transparent",
              background: viewMode === mode ? "white" : "transparent",
              boxShadow: viewMode === mode ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              color: viewMode === mode ? "#111827" : "#6b7280",
            }}
          >
            {mode === "list" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            {mode === "hybrid" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>}
            {mode === "map" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
            <span>{mode === "list" ? t.list : mode === "hybrid" ? t.hybrid : t.map}</span>
          </button>
        ))}
      </div>

      <div role="group" aria-label="Language" style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {(["fr", "nl", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => onLocaleChange(l)}
            aria-pressed={locale === l}
            style={{
              borderRadius: 4, padding: "4px 6px", fontSize: 12, fontWeight: 500, textTransform: "uppercase", border: "none", cursor: "pointer",
              ...(locale === l
                ? { background: "#1892a2", color: "white" }
                : { background: "#f3f4f6", color: "#6b7280" }),
            }}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
