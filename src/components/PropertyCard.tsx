"use client";

import { useState } from "react";
import { Property } from "@/data/properties";
import { Translations } from "@/data/i18n";
import { formatPrice } from "@/lib/format";
import { EuroIcon, RulerIcon, BedIcon } from "@/components/Icons";

interface PropertyCardProps {
  property: Property;
  t: Translations;
  isActive?: boolean;
  onClick?: () => void;
}

function SpecRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 36, padding: 8, gap: 8 }}>
      <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", lineHeight: "20px", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

export default function PropertyCard({
  property,
  t,
  isActive,
  onClick,
}: PropertyCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const totalPhotos = property.images.length;

  function prevPhoto(e: React.MouseEvent) {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  }

  function nextPhoto(e: React.MouseEvent) {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  }

  const priceLabel = formatPrice(property.price) + (property.transaction === "rent" ? t.perMonth : "");

  return (
    <div
      style={{
        cursor: "pointer",
        borderRadius: 24,
        transition: "all 0.15s",
        ...(isActive
          ? { background: "rgba(249,115,22,0.1)", border: "2px solid #f97316", padding: 8 }
          : {}),
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, width: "50%" }}>
          <div style={{
            flex: 1, minHeight: 140, position: "relative",
            borderRadius: "16px 6px 6px 6px", border: "1px solid #f3f4f6",
            boxShadow: "0 1px 2px -1px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}>
            <img
              src={property.images[photoIndex]}
              alt={`${t[property.type]} - ${property.address}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
            />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={prevPhoto}
              style={{
                background: "white", border: "1px solid #d1d5db",
                borderRadius: "6px 6px 16px 6px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: "7px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: 500, color: "#4b5563", lineHeight: "16px", padding: "6px 8px" }}>
              {photoIndex + 1} {t.photoOf} {totalPhotos} {t.photos}
            </div>
            <button
              onClick={nextPhoto}
              style={{
                background: "white", border: "1px solid #d1d5db", borderRadius: 6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: "7px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{
            background: "white", border: "1px solid #d1d5db",
            borderRadius: "6px 16px 16px 6px",
            boxShadow: "0 1px 2px -1px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden", flex: 1, display: "flex", flexDirection: "column",
          }}>
            <div style={{ paddingTop: 16, paddingLeft: 12, paddingRight: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", lineHeight: "24px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t[property.type]}
              </p>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", lineHeight: "20px" }}>
                <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.address}</p>
                <p style={{ margin: 0 }}>{property.postalCode}</p>
              </div>
            </div>
            <div style={{ padding: "8px 0", flex: 1 }}>
              <SpecRow icon={<EuroIcon />} label={priceLabel} />
              <SpecRow icon={<RulerIcon />} label={`${property.surface} m²`} />
              {property.bedrooms > 0 && (
                <SpecRow icon={<BedIcon />} label={`${property.bedrooms} ${t.bedrooms}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
