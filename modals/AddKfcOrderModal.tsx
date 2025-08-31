import React, { useState, useRef } from 'react';
import Modal from '../components/Modal';
import type { AppState, OrderItem, Order } from '../types';
import { isKfcSurovinaByName } from '../constants';

const generateId = () => crypto.randomUUID();

interface AddKfcOrderModalProps {
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddKfcOrderModal: React.FC<AddKfcOrderModalProps> = ({ selectedDate, appData, setAppData, showToast, onClose }) => {
    const [items, setItems] = useState<{ [surovinaId: string]: number }>({});
    const formRef = useRef<HTMLFormElement>(null);

    const handleCountChange = (surovinaId: string, count: number) => {
        setItems(prev => ({ ...prev, [surovinaId]: count }));
    };

    const handleSave = () => {
        const kfcCustomer = appData.zakaznici.find(c => c.name.toLowerCase() === 'kfc');
        if (!kfcCustomer) {
            showToast('Zákazník KFC nebyl nalezen.', 'error');
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
            let order = newOrders.find(o => o.customerId === kfcCustomer.id && o.date === selectedDate && o.orderType === 'standard');
            if (!order) {
                // FIX: Added missing 'orderType' property, assuming KFC orders are 'standard'.
                order = { id: generateId(), date: selectedDate, customerId: kfcCustomer.id, items: [], orderType: 'standard' };
                newOrders.push(order);
            }
            order.items.push(...newItems);
            return { ...prev, orders: newOrders };
        });

        showToast('Položky přidány do KFC objednávky');
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

    const kfcSuroviny = appData.suroviny.filter(s => isKfcSurovinaByName(s.name));

    return (
        <Modal
            title={`Přidat KFC objednávku na ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('cs-CZ')}`}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button type="submit" form="add-kfc-order-form" className="btn btn-primary">Přidat do objednávky</button></>}
        >
            <form id="add-kfc-order-form" ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="table-responsive-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Produkt</th><th>Počet beden</th></tr></thead>
                        <tbody>
                            {kfcSuroviny.map(s => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            onChange={e => handleCountChange(s.id, parseInt(e.target.value) || 0)}
                                            onKeyDown={handleKeyDown}
                                            style={{ width: '100px' }}
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

export default AddKfcOrderModal;