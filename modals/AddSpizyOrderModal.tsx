import React, { useState } from 'react';
import Modal from '../components/Modal';
import type { AppState, OrderItem, Order } from '../types';

const generateId = () => crypto.randomUUID();

interface AddSpizyOrderModalProps {
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddSpizyOrderModal: React.FC<AddSpizyOrderModalProps> = ({ selectedDate, appData, setAppData, showToast, onClose }) => {
    const [customerId, setCustomerId] = useState<string>(appData.zakaznici.filter(c => c.name.toLowerCase() !== 'kfc')[0]?.id || '');

    const newSpizySuroviny = appData.suroviny.filter(s => 
        ['ŠPÍZY - ŠPEK', 'ŠPÍZY - KLOBÁSA', 'ŠPÍZY - ČILI MANGO'].includes(s.name.toUpperCase())
    );

    const [items, setItems] = useState<{ [surovinaId: string]: number }>({});

    const handleCountChange = (surovinaId: string, count: number) => {
        setItems(prev => ({ ...prev, [surovinaId]: count }));
    };

    const handleSave = () => {
        if (!customerId) {
            showToast('Musíte vybrat zákazníka.', 'error');
            return;
        }

        const newItems: OrderItem[] = Object.entries(items)
            .filter(([, count]) => count > 0)
            .map(([surovinaId, boxCount]) => ({ id: generateId(), surovinaId, boxCount }));

        if (newItems.length === 0) {
            showToast('Nebyly zadány žádné položky.', 'error');
            return;
        }

        setAppData(prev => {
            const newOrders = [...prev.orders];
            let order = newOrders.find(o => o.customerId === customerId && o.date === selectedDate && o.orderType === 'standard');
            if (!order) {
                order = { id: generateId(), date: selectedDate, customerId, items: [], orderType: 'standard' };
                newOrders.push(order);
            }
            order.items.push(...newItems);
            return { ...prev, orders: newOrders };
        });

        showToast('Objednávka na špízy byla přidána.');
        onClose();
    };

    return (
        <Modal
            title="Přidat objednávku na Špízy"
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit</button></>}
        >
            <div className="form-group">
                <label>Zákazník</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    <option value="">-- Vyberte zákazníka --</option>
                    {appData.zakaznici.filter(c => c.name.toLowerCase() !== 'kfc').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--dz-border-color)', margin: '20px 0' }} />
            
            {newSpizySuroviny.map(surovina => (
                 <div className="form-group" key={surovina.id}>
                    <label>{surovina.name.replace('ŠPÍZY - ', '')}</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="Počet beden"
                        onChange={e => handleCountChange(surovina.id, parseInt(e.target.value) || 0)}
                    />
                </div>
            ))}
        </Modal>
    );
};

export default AddSpizyOrderModal;
