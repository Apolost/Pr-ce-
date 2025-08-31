import React, { useState, useRef } from 'react';
import Modal from '../components/Modal';
import type { AppState, Order, OrderItem } from '../types';
import { isKfcSurovinaByName } from '../constants';

const generateId = () => crypto.randomUUID();

interface AddOrderModalProps {
    customerId: string;
    selectedDate: string;
    orderType: Order['orderType'];
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ customerId, selectedDate, orderType, appData, setAppData, showToast, onClose }) => {
    const [items, setItems] = useState<{[surovinaId: string]: number}>({});
    const formRef = useRef<HTMLFormElement>(null);

    const handleCountChange = (surovinaId: string, count: number) => {
        setItems(prev => ({ ...prev, [surovinaId]: count }));
    };

    const handleSave = () => {
        const newItems: OrderItem[] = Object.entries(items)
            .filter(([, count]) => count > 0)
            .map(([surovinaId, boxCount]) => ({ id: generateId(), surovinaId, boxCount }));
            
        if (newItems.length === 0) {
            showToast('Nebyly zadány žádné položky.', 'error');
            return;
        }

        setAppData(prev => {
            const newOrders = [...prev.orders];
            let order = newOrders.find(o => o.customerId === customerId && o.date === selectedDate && o.orderType === orderType);
            
            if (!order) {
                order = { id: generateId(), date: selectedDate, customerId, items: [], orderType };
                newOrders.push(order);
            }
            order.items.push(...newItems);
            return { ...prev, orders: newOrders };
        });
        
        const orderTypeLabels = { standard: 'OA RB', extra: 'extra', bulk: 'volně ložené' };
        showToast(`Položky přidány do ${orderTypeLabels[orderType]} objednávky`);
        onClose();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!formRef.current) return;

            const inputs = Array.from(formRef.current.querySelectorAll<HTMLInputElement>('input[type="number"]'));
            const currentIndex = inputs.indexOf(e.currentTarget);
            const nextInput = inputs[currentIndex + 1];

            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            } else {
                const saveButton = formRef.current.closest('.modal-content')?.querySelector('.btn-primary') as HTMLButtonElement;
                saveButton?.focus();
            }
        }
    };


    const customerName = appData.zakaznici.find(c => c.id === customerId)?.name || '';
    const filteredSuroviny = appData.suroviny.filter(s => (s.isActive ?? true) && !isKfcSurovinaByName(s.name));
    const orderTypeLabels = { standard: 'OA RB', extra: 'extra', bulk: 'volně ložené' };
    const modalTitle = `Přidat ${orderTypeLabels[orderType]} položky pro: ${customerName}`;

    return (
        <Modal
            title={modalTitle}
            onClose={onClose}
            maxWidth="550px"
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button type="submit" form="add-order-form" className="btn btn-primary">Přidat do objednávky</button></>}
        >
            <form id="add-order-form" ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="table-responsive-wrapper" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Produkt</th><th>Počet beden</th></tr></thead>
                        <tbody>
                            {filteredSuroviny.map(s => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            onChange={e => handleCountChange(s.id, parseInt(e.target.value) || 0)} 
                                            onKeyDown={handleKeyDown}
                                            style={{width: '100px'}} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </form>
        </Modal>
    );
};

export default AddOrderModal;