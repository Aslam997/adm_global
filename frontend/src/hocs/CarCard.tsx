import React from "react";

export interface CarCardProps {
  image: string;
  model: string;
  equipment?: string;
  price: string;
  selected?: boolean; // add this
  onClick?: () => void; // new: click handler to open modal or details
}

const CarCard: React.FC<CarCardProps> = ({ image, model, price, onClick, equipment, selected=false }) => {
  return (
    <button
      onClick={onClick}
      className={`"w-140 bg-white rounded-md shadow hover:shadow-lg overflow-hidden transition-shadow duration-200 text-left"
          ${selected ? "opacity-50" : "opacity-100"}
        `}
      type="button"
    >
      {/* Car Image */}
      <div className="h-70 w-full overflow-hidden">
        <img src={image} alt={model} className="w-full h-full object-cover" />
      </div>

      {/* Footer section with model + price */}
      <div className="p-4 flex flex-col items-start w-full">
        <div className="flex justify-between w-full">
          <h3 className="text-lg font-semibold">{model}</h3>
          {equipment && <h3 className="text-lg font-semibold">{equipment}</h3>}
        </div>
        <p className="text-sky-600 font-bold">{price}</p>
      </div>
    </button>
  );
};

export default CarCard;
