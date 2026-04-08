"use client";

import { useState } from "react";

const NAV_LINKS = [
  { label: "Acheter", href: "#" },
  { label: "Louer", href: "#" },
  { label: "Vendre", href: "#" },
  { label: "Estimer", href: "#" },
  { label: "Nos agences", href: "#" },
];

function NavLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: hovered ? "#1892A2" : "#374151",
        textDecoration: "none",
        transition: "color 0.15s",
        padding: "6px 0",
      }}
    >
      {label}
    </a>
  );
}

export default function Nav() {
  return (
    <nav
      style={{
        height: "var(--layout-nav-h)",
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--layout-padding)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "var(--color-turquoise-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          W
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-navy)" }}>
          We Invest
        </span>
      </a>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {NAV_LINKS.map((link) => (
          <NavLink key={link.label} {...link} />
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#374151",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          Se connecter
        </button>
        <button
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "white",
            background: "var(--gradient-cta)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Publier une annonce
        </button>
      </div>
    </nav>
  );
}
