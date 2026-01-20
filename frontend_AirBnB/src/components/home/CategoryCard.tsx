"use client";

import React from "react";
import { Card } from "antd";
import { useRouter } from "next/navigation";
import styles from "@/styles/category-card.module.css";

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  filterValue?: string;
  filterType?: "amenity" | "city" | "country";
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  icon, 
  label, 
  filterValue,
  filterType = "amenity"
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (filterValue) {
      const params = new URLSearchParams();
      if (filterType === "amenity") {
        // For amenities, we'll need to handle this in search page
        params.set("amenity", filterValue);
      } else if (filterType === "city") {
        params.set("city", filterValue);
      } else if (filterType === "country") {
        params.set("country", filterValue);
      }
      router.push(`/search?${params.toString()}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <Card
      hoverable
      className={styles.categoryCard}
      onClick={handleClick}
      bodyStyle={{ padding: "16px", textAlign: "center" }}
    >
      <div className={styles.categoryIcon}>{icon}</div>
      <div className={styles.categoryLabel}>{label}</div>
    </Card>
  );
};

export default CategoryCard;

