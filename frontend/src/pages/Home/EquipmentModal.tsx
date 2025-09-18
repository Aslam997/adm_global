import React, { useState, useEffect } from "react";
import { formatPrice } from "../../services/helpers";
import { useNavigate } from "react-router-dom";

export interface Equipment {
id: number;
  name: string;
  price: number;
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  carName?: string;
  equipments: Equipment[]; // list coming from backend
  onSelect: (selected: Equipment | null) => void; // returns selected equipment on confirm
  initialSelectedIndex?: number | null;
}



const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  carName,
  equipments,
  onSelect,
  initialSelectedIndex = null,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialSelectedIndex
  );

  const navigate = useNavigate();

  // reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) setSelectedIndex(initialSelectedIndex);
  }, [isOpen, initialSelectedIndex]);

  if (!isOpen) return null;
  const confirm = () => {
    if (selectedIndex !== null) {
      const selected = equipments[selectedIndex];
  
      // ✅ put equipment id in the URL
      navigate(`/equipment/${selected.id}`);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* modal panel */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full z-10 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{carName ?? "Select option"}</h3>
              <p className="text-sm text-slate-500">Komplektatsiayni tanlang</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-auto p-4 space-y-2">
          {equipments.length === 0 && (
            <div className="text-sm text-slate-600">Komplektatsiyalar mavjud emas</div>
          )}

          {equipments.map((eq, idx) => (
            <label
              key={`${eq.name}-${eq.price}-${idx}`}
              className={`flex items-center justify-between p-3 rounded-md border cursor-pointer
                ${selectedIndex === idx ? "border-sky-500 bg-sky-50" : "border-slate-100 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="equipment"
                  checked={selectedIndex === idx}
                  onChange={() => setSelectedIndex(idx)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{eq.name}</div>
                  <div className="text-xs text-slate-500">Narxi: {formatPrice(eq.price)}</div>
                </div>
              </div>
              <div className="text-sm font-semibold">{formatPrice(eq.price)}</div>
            </label>
          ))}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setSelectedIndex(null);
              onSelect(null);
              onClose();
            }}
            className="px-4 py-2 rounded-md border text-sm"
          >
            Bekor qilish
          </button>

          <button
            onClick={() => {
              const selected = selectedIndex != null ? equipments[selectedIndex] : null;
              onSelect(selected);
              confirm();
            }}
            className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-60"
            disabled={selectedIndex === null}
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentModal;
