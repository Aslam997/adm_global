import React, { useState } from "react";

import EquipmentModal from "./EquipmentModal";
import { useCarModels } from "../../hooks/useCarModels";
import type { CarModel, Equipment } from "../../types/cars";
import CarGridPage from "./CarGridPage";


const HomePage: React.FC = () => {
  const { cars, loading, error } = useCarModels();

  // modal state lives here now
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setChosenEquipment] = useState<Equipment | null>(null);

  const openModalForCar = (car: CarModel) => {
    setSelectedCar(car);
    setChosenEquipment(null);
    setIsModalOpen(true);
  };

  const handleSelectEquipment = (equip: Equipment | null) => {
    setChosenEquipment(equip);
    if (equip) console.log("Selected equipment:", equip);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Avto Modellar</h1>

        {loading && <div className="py-12 text-center text-slate-600">Yuklanmoqda…</div>}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded mb-4">
            Error: {error}
          </div>
        )}
        {!loading && cars.length === 0 && !error && (
          <div className="py-12 text-center">Modellar mavjud emas.</div>
        )}

        {/* purely presentational */}
        <CarGridPage cars={cars} onCarClick={openModalForCar} />
      </div>

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        carName={selectedCar ? `${selectedCar.brand_name ?? ""} ${selectedCar.name}` : undefined}
        equipments={selectedCar?.equipments ?? []}
        onSelect={handleSelectEquipment}
      />
    </div>
  );
};

export default HomePage;
