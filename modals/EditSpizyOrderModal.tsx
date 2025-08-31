import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, OrderItem } from '../types';

const generateId = () => crypto.randomUUID();

interface EditSpizyOrderModalProps {
    customerId: string;
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const EditSpizyOrderModal: React.FC<EditSpizyOrderModalProps> = ({ customerId, selectedDate, appData, setAppData, showToast, onClose }) => {
    const spizySuroviny = appData.suroviny.filter(s =>
        ['ŠPÍZY - ŠPEK', 'ŠPÍZY - KLOBÁSA', 'ŠPÍZY - ČILI MANGO'].includes(s.name.toUpperCase())
    );

    const [items, setItems] = useState<{ [surovinaId: string]: number }>({});

    useEffect(() => {
        const order = appData.orders.find(o => o.customerId === customerId && o.date === selectedDate && o.orderType === 'standard');
        const initialItems: { [surovinaId: string]: number } = {};
        spizySuroviny.forEach(s => {
            const orderItem = order?.items.find(i => i.surovinaId === s.id);
            initialItems[s.id] = orderItem?.boxCount || 0;
        });
        setItems(initialItems);
    }, [customerId, selectedDate, appData.orders, spizySuroviny]);

    const handleCountChange = (surovinaId: string, count: number) => {
        setItems(prev => ({ ...prev, [surovinaId]: count }));
    };

    const handleSave = () => {
        setAppData(prev => {
            const newOrders = JSON.parse(JSON.stringify(prev.orders));
            let order = newOrders.find((o: any) => o.customerId === customerId && o.date === selectedDate && o.orderType === 'standard');
            
            if (!order) {
                const newItemsCount = Object.values(items).reduce((sum, count) => sum + count, 0);
                if (newItemsCount === 0) return prev; 
                order = { id: generateId(), date: selectedDate, customerId, items: [], orderType: 'standard' };
                newOrders.push(order);
            }
            
            const spizySurovinaIds = spizySuroviny.map(s => s.id);
            order.items = order.items.filter((item: OrderItem) => !spizySurovinaIds.includes(item.surovinaId));

            const updatedItems: OrderItem[] = Object.entries(items)
                .filter(([, count]) => count > 0)
                .map(([surovinaId, boxCount]) => ({ id: generateId(), surovinaId, boxCount }));
            
            order.items.push(...updatedItems);

            return { ...prev, orders: newOrders.filter((o: any) => o.items.length > 0) };
        });

        showToast('Objednávka na špízy byla upravena.');
        onClose();
    };
    
    const customerName = appData.zakaznici.find(c => c.id === customerId)?.name || 'N/A';

    return (
        <Modal
            title={`Upravit objednávku Špízů pro ${customerName}`}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit</button></>}
        >
            {spizySuroviny.map(surovina => (
                 <div className="form-group" key={surovina.id}>
                    <label>{surovina.name.replace('ŠPÍZY - ', '')}</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="Počet beden"
                        value={items[surovina.id] || ''}
                        onChange={e => handleCountChange(surovina.id, parseInt(e.target.value) || 0)}
                    />
                </div>
            ))}
        </Modal>
    );
};

export default EditSpizyOrderModal;
