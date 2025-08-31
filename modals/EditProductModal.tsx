import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, Order } from '../types';

interface EditProductModalProps {
    surovinaId: string;
    customerId: string;
    orderType: Order['orderType'];
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ surovinaId, customerId, orderType, appData, setAppData, showToast, onClose }) => {
    const surovina = appData.suroviny.find(s => s.id === surovinaId);
    const customer = appData.zakaznici.find(c => c.id === customerId);

    const [productName, setProductName] = useState(surovina?.name || '');
    const [boxWeight, setBoxWeight] = useState(0);

    useEffect(() => {
        if (surovina) {
            setProductName(surovina.name);
        }
        const weightInGrams = appData.boxWeights[customerId]?.[orderType]?.[surovinaId] || 0;
        setBoxWeight(weightInGrams / 1000);
    }, [surovina, surovinaId, customerId, orderType, appData.boxWeights]);

    if (!surovina || !customer) {
        return null;
    }

    const handleSave = () => {
        if (!productName.trim()) {
            showToast('Název produktu nesmí být prázdný.', 'error');
            return;
        }

        const normalizedName = productName.trim().toUpperCase();
        const existingSurovina = appData.suroviny.find(s => s.name.toUpperCase() === normalizedName);
        if (existingSurovina && existingSurovina.id !== surovinaId) {
            showToast('Produkt s tímto názvem již existuje.', 'error');
            return;
        }

        setAppData(prev => {
            const updatedSuroviny = prev.suroviny.map(s =>
                s.id === surovinaId ? { ...s, name: productName.trim().toUpperCase() } : s
            );

            const updatedBoxWeights = JSON.parse(JSON.stringify(prev.boxWeights));
            if (!updatedBoxWeights[customerId]) {
                updatedBoxWeights[customerId] = { standard: {}, extra: {}, bulk: {} };
            }
            if (!updatedBoxWeights[customerId][orderType]) {
                updatedBoxWeights[customerId][orderType] = {};
            }
            updatedBoxWeights[customerId][orderType][surovinaId] = Math.round(boxWeight * 1000);

            return {
                ...prev,
                suroviny: updatedSuroviny,
                boxWeights: updatedBoxWeights,
            };
        });

        showToast('Produkt byl úspěšně upraven.');
        onClose();
    };
    
    const orderTypeLabels = { standard: 'OA RB', extra: 'Extra', bulk: 'Volně ložené' };
    const modalTitle = `Upravit produkt pro: ${customer.name} (${orderTypeLabels[orderType]})`;

    return (
        <Modal
            title={modalTitle}
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave}>Uložit změny</button>
                </>
            }
        >
            <div className="form-group">
                <label htmlFor="productName">Název produktu</label>
                <input
                    id="productName"
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                />
                 <small style={{display: 'block', marginTop: '8px', color: 'var(--text-secondary)'}}>
                    Změna názvu se projeví globálně v celé aplikaci.
                </small>
            </div>
            <div className="form-group">
                <label htmlFor="boxWeight">Váha bedny (kg)</label>
                <input
                    id="boxWeight"
                    type="number"
                    step="0.001"
                    min="0"
                    value={boxWeight}
                    onChange={e => setBoxWeight(parseFloat(e.target.value) || 0)}
                />
            </div>
        </Modal>
    );
};

export default EditProductModal;
