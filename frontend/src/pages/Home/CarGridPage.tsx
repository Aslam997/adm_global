import React from "react";

import type { CarModel } from "../../types/cars";
import { formatPrice } from "../../services/helpers";
import type { GridItem } from "../../hocs/carGrid";
import CarCardGrid from "../../hocs/carGrid";

type Props = {
  cars: CarModel[];
  onCarClick?: (car: CarModel) => void;
};

const CarGridPage: React.FC<Props> = ({ cars, onCarClick }) => {
  const items: GridItem[] = cars.map((car) => ({
    key: String(car.id),
    image: car.image,
    model: `${car.brand_name ? `${car.brand_name} ` : ""}${car.name}`,
    price: formatPrice(car.min_price),
    onClick: onCarClick ? () => onCarClick(car) : undefined,
  }));

  return <CarCardGrid items={items} emptyText="No car models." />;
};

export default CarGridPage;
