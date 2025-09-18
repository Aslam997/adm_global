import React from "react";
import CarCard from "../hocs/CarCard";

export type GridItem = {
  key: string;
  image?: string | null;
  model: string;
  price: string; 
  equipment?: string;          // optional subtitle (used by Compare page)
  selected?: boolean;          // optional selection highlight
  onClick?: () => void;        // click handler (open modal / toggle select)
};

type Props = {
  items: GridItem[];
  emptyText?: string;
  className?: string;
};

const CarCardGrid: React.FC<Props> = ({ items, emptyText = "No items.", className }) => {
  if (!items?.length) {
    return (
      <div className="col-span-full text-center text-slate-500 py-8">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={["grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6", className].filter(Boolean).join(" ")}>
      {items.map((it) => (
        <CarCard
          key={it.key}
          image={it.image ?? "https://via.placeholder.com/400x300?text=No+Image"}
          model={it.model}
          price={it.price}
          equipment={it.equipment}
          selected={it.selected}
          onClick={it.onClick}
        />
      ))}
    </div>
  );
};

export default CarCardGrid;
