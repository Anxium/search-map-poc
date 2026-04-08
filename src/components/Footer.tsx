"use client";

const FOOTER_COLUMNS = [
  {
    title: "Immobilier",
    links: ["Acheter un bien", "Louer un bien", "Vendre mon bien", "Estimation gratuite", "Biens neufs"],
  },
  {
    title: "We Invest",
    links: ["A propos", "Nos agences", "Rejoindre le reseau", "Carrières", "Presse"],
  },
  {
    title: "Ressources",
    links: ["Blog immobilier", "Guide de l'acheteur", "Simulateur de prêt", "FAQ", "Contact"],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-navy)",
        color: "white",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          maxWidth: "var(--layout-max)",
          margin: "0 auto",
          padding: "48px var(--layout-padding) 32px",
          display: "grid",
          gridTemplateColumns: "1.5fr repeat(3, 1fr)",
          gap: 40,
        }}
      >
        {/* Brand column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            <span style={{ fontSize: 18, fontWeight: 700 }}>We Invest</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-gray-400)", maxWidth: 280 }}>
            Le réseau immobilier nouvelle génération. Achat, vente et location de biens en Belgique.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            {["Facebook", "Instagram", "LinkedIn"].map((name) => (
              <a
                key={name}
                href="#"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-gray-400)",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {name[0]}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>{col.title}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{ fontSize: 13, color: "var(--color-gray-400)", textDecoration: "none" }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          maxWidth: "var(--layout-max)",
          margin: "0 auto",
          padding: "20px var(--layout-padding)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-gray-400)" }}>
          © 2026 We Invest. Tous droits réservés.
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Conditions générales", "Vie privée", "Cookies"].map((text) => (
            <a key={text} href="#" style={{ fontSize: 12, color: "var(--color-gray-400)", textDecoration: "none" }}>
              {text}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
