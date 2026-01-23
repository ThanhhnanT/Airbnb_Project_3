"use client";

import React from "react";

interface AmenityCardProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const AmenityCard: React.FC<AmenityCardProps> = ({
  icon,
  label,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: "100%",
        textAlign: "center",
        cursor: "pointer",
        border: "1px solid #d9d9d9",
        borderRadius: "8px",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        transition: "all 0.2s",
        backgroundColor: selected ? "#ff4d4f" : "#fff",
        boxSizing: "border-box",
        minHeight: "120px",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#ff4d4f";
          e.currentTarget.style.backgroundColor = "#fff5f5";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#d9d9d9";
          e.currentTarget.style.backgroundColor = "#fff";
        }
      }}
    >
      <div style={{ fontSize: "32px", color: selected ? "#fff" : "#666" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: selected ? 600 : 500, color: selected ? "#fff" : "#333" }}>
        {label}
      </div>
    </div>
  );
};

export default AmenityCard;
