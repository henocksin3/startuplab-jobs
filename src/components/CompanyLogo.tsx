"use client";

import { useState, useRef } from "react";

interface Props {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}

function colorForName(name: string): string {
  const palette = ["#FF3333", "#CC292E", "#925656", "#6F6F93", "#422E2F", "#1D2526"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function CompanyLogo({ name, logoUrl, size = 40, className }: Props) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const initial = name.trim().charAt(0).toUpperCase() || "·";

  if (!logoUrl || failed) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          background: colorForName(name),
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: size * 0.42,
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={logoUrl}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", borderRadius: 4, flexShrink: 0, background: "#fff" }}
      onError={() => setFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        // Google S2 returns 16×16 globe for unknown sites, 32+ for real favicons.
        if (img.naturalWidth > 0 && img.naturalWidth < 24) setFailed(true);
      }}
    />
  );
}
