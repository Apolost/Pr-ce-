import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, Zakaznik } from '../types';

const generateId = () => crypto.randomUUID();

interface AddCustomerModalProps {
    customerId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ customerId, appData, setAppData, showToast, onClose }) => {
    const [name, setName] = useState('');

    const isEditing = Boolean(customerId);

    useEffect(() => {
        if (isEditing) {
            const customer = appData.zakaznici.find(c => c.id === customerId);
            if (customer) {
                setName(customer.name);
            }
        }
    }, [customerId, appData.zakaznici, isEditing]);

    const handleSave = () => {
        if (!name.trim()) {
            showToast('Název zákazníka nesmí být prázdný.', 'error');
            return;
        }

        const normalizedName = name.trim().toUpperCase();
        const existingCustomer = appData.zakaznici.find(c => c.name.toUpperCase() === normalizedName);
        if (existingCustomer && existingCustomer.id !== customerId) {
            showToast('Zákazník s tímto názvem již existuje.', 'error');
            return;
        }

        if (isEditing) {
            setAppData(prev => ({
                ...prev,
                zakaznici: prev.zakaznici.map(c => c.id === customerId ? { ...c, name: name.trim() } : c),
            }));
            showToast('Zákazník upraven');
        } else {
            const newCustomer: Zakaznik = {
                id: generateId(),
                name: name.trim()
            };
            setAppData(prev => {
                // FIX: Correctly initialize box weights for the new customer for all order types.
                const newBoxWeights = { ...prev.boxWeights };
                const weightsForCustomer: { [surovinaId: string]: number } = {};
                prev.suroviny.forEach(s => {
                    weightsForCustomer[s.id] = 10000;
                });

                newBoxWeights[newCustomer.id] = {
                    standard: { ...weightsForCustomer },
                    extra: { ...weightsForCustomer },
                    bulk: { ...weightsForCustomer },
                };

                return {
                    ...prev,
                    zakaznici: [...prev.zakaznici, newCustomer],
                    boxWeights: newBoxWeights,
                };
            });
            showToast('Nový zákazník přidán');
        }
        onClose();
    };

    return (
        <Modal
            title={isEditing ? 'Upravit zákazníka' : 'Přidat nového zákazníka'}
            onClose={onClose}
            maxWidth="500px"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave}>Uložit</button>
                </>
            }
        >
            <div className="form-group">
                <label htmlFor="customerName">Název zákazníka</label>
                <input
                    id="customerName"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Např. Globus"
                    autoFocus
                />
            </div>
        </Modal>
    );
};

export default AddCustomerModal;