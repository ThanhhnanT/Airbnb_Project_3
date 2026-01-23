"use client";

import React from "react";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";

interface CounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const Counter: React.FC<CounterProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
}) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div>
        <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: 4 }}>
          {label}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Button
          type="text"
          icon={<MinusOutlined />}
          onClick={handleDecrease}
          disabled={value <= min}
          style={{
            width: "32px",
            height: "32px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: value <= min ? "1px solid #d9d9d9" : "1px solid #000",
            color: value <= min ? "#bfbfbf" : "#000",
            backgroundColor: value <= min ? "#fafafa" : "#fff",
            cursor: value <= min ? "not-allowed" : "pointer",
          }}
        />
        <span
          style={{
            fontSize: "18px",
            fontWeight: 500,
            minWidth: "30px",
            textAlign: "center",
          }}
        >
          {value}
        </span>
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={handleIncrease}
          disabled={value >= max}
          style={{
            width: "32px",
            height: "32px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: value >= max ? "1px solid #d9d9d9" : "1px solid #000",
            color: value >= max ? "#bfbfbf" : "#000",
            backgroundColor: value >= max ? "#fafafa" : "#fff",
            cursor: value >= max ? "not-allowed" : "pointer",
          }}
        />
      </div>
    </div>
  );
};

export default Counter;
