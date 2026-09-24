import { useState } from "react";

type GearSlot = "Head" | "Body" | "Hands" | "Feet";
type GearItem = "Hard Hat" | "High-Vis Vest" | "Protective Gloves" | "Steel-Toed Boots";

interface SlotData {
  required: GearItem;
  current: GearItem | null;
}

export function PPECheckModule({ onComplete }: { onComplete: (score: number) => void }) {
  const [slots, setSlots] = useState<Record<GearSlot, SlotData>>({
    Head: { required: "Hard Hat", current: null },
    Body: { required: "High-Vis Vest", current: null },
    Hands: { required: "Protective Gloves", current: null },
    Feet: { required: "Steel-Toed Boots", current: null },
  });

  const [inventory, setInventory] = useState<GearItem[]>([
    "Steel-Toed Boots",
    "Hard Hat",
    "Protective Gloves",
    "High-Vis Vest",
  ]);

  const [selectedItem, setSelectedItem] = useState<GearItem | null>(null);

  const handleSlotClick = (slotKey: GearSlot) => {
    if (selectedItem) {
      const slot = slots[slotKey];
      if (slot.required === selectedItem) {
        setSlots({
          ...slots,
          [slotKey]: { ...slot, current: selectedItem },
        });
        setInventory(inventory.filter((i) => i !== selectedItem));
        setSelectedItem(null);
      } else {
        alert("Incorrect slot for this gear!");
      }
    }
  };

  const isComplete = Object.values(slots).every((s) => s.current !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', maxWidth: '600px', margin: '20px auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
          Pre-Shift PPE Gear Check
        </h2>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Select an item from your inventory and click the correct body slot to equip it.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Avatar Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', color: '#444' }}>Trainee Avatar Slots</h3>
          {(Object.keys(slots) as GearSlot[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSlotClick(key)}
              style={{
                width: '100%', padding: '15px', border: '2px dashed', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer',
                ...(slots[key].current
                  ? { backgroundColor: '#f0fdf4', borderColor: '#22c55e', color: '#15803d' }
                  : selectedItem
                  ? { backgroundColor: '#eff6ff', borderColor: '#93c5fd', color: '#1e40af' }
                  : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#9ca3af' })
              }}
            >
              <span style={{ fontWeight: '500' }}>{key}</span>
              <span>{slots[key].current || "Empty"}</span>
            </button>
          ))}
        </div>

        {/* Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontWeight: '600', color: '#444' }}>Available Gear</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {inventory.length === 0 && (
              <p style={{ color: '#16a34a', fontWeight: '500' }}>
                All gear equipped!
              </p>
            )}
            {inventory.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedItem(item === selectedItem ? null : item)}
                style={{
                  padding: '10px', borderRadius: '8px', border: '2px solid', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                  ...(selectedItem === item
                    ? { backgroundColor: '#2563eb', borderColor: '#1d4ed8', color: '#fff', transform: 'scale(1.05)' }
                    : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' })
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete(100)}
        disabled={!isComplete}
        style={{
          width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.125rem', cursor: isComplete ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
          ...(isComplete
            ? { backgroundColor: '#16a34a', color: '#fff' }
            : { backgroundColor: '#e5e7eb', color: '#9ca3af' })
        }}
      >
        {isComplete ? "Verify Equipment & Finish Minigame" : "Equip all gear to verify"}
      </button>
    </div>
  );
}
