import React, { useState, useMemo } from 'react';
import Modal from '../components/Modal';
import type { AppState, KfcComposition } from '../types';
import { isKfcSurovinaByName } from '../constants';

interface KfcCompositionModalProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const KfcCompositionModal: React.FC<KfcCompositionModalProps> = ({ appData, setAppData, showToast, onClose }) => {
    const [compositions, setCompositions] = useState<AppState['kfcCompositions']>(appData.kfcCompositions);
    
    const kfcCustomer = useMemo(() => appData.zakaznici.find(c => c.name.toLowerCase() === 'kfc'), [appData.zakaznici]);
    const kfcId = kfcCustomer?.id;

    const [kfcBoxWeights, setKfcBoxWeights] = useState(kfcId ? appData.boxWeights[kfcId]?.standard || {} : {});

    const kfcProducts = appData.suroviny.filter(s => isKfcSurovinaByName(s.name));
    
    const allowedRawMaterialNames = ['PLACKY', 'BANDURY', 'STRIPS', 'ŘÍZKY', 'HORNÍ STEHNA', 'SPODNÍ STEHNA'];
    const rawMaterials = appData.suroviny.filter(s => allowedRawMaterialNames.includes(s.name.toUpperCase()));

    const handleChange = (kfcProductId: string, field: keyof KfcComposition, value: string) => {
        const currentComp = compositions[kfcProductId] || { baseSurovinaId: '', lossPercent: 0 };
        const updatedValue = field === 'lossPercent' ? parseFloat(value) || 0 : value;
        
        setCompositions(prev => ({
            ...prev,
            [kfcProductId]: {
                ...currentComp,
                [field]: updatedValue,
            }
        }));
    };
    
    const handleWeightChange = (kfcProductId: string, value: string) => {
        const weightInGrams = Math.round(parseFloat(value) * 1000);
        setKfcBoxWeights(prev => ({
            ...prev,
            [kfcProductId]: isNaN(weightInGrams) ? 0 : weightInGrams
        }));
    };

    const handleSave = () => {
        if (!kfcId) {
            showToast('Zákazník KFC nebyl nalezen. Nelze uložit váhy beden.', 'error');
            return;
        }

        setAppData(prev => {
            const newBoxWeights = JSON.parse(JSON.stringify(prev.boxWeights));
            if (!newBoxWeights[kfcId]) {
                newBoxWeights[kfcId] = { standard: {}, extra: {}, bulk: {} };
            }
            newBoxWeights[kfcId].standard = { ...newBoxWeights[kfcId].standard, ...kfcBoxWeights };

            return {
                ...prev,
                kfcCompositions: compositions,
                boxWeights: newBoxWeights,
            };
        });
        showToast('Složení a váhy KFC produktů byly uloženy.');
        onClose();
    };

    return (
        <Modal
            title="Nastavení složení a ztrát pro KFC"
            onClose={onClose}
            maxWidth="900px"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave}>Uložit změny</button>
                </>
            }
        >
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Zde definujte, z jaké základní suroviny se jednotlivé KFC produkty vyrábí a jaká je přitom výrobní ztráta. Tyto údaje se použijí pro výpočet reálné potřeby na porcovně.
            </p>
            <div className="table-responsive-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>KFC Produkt</th>
                            <th>Základní surovina</th>
                            <th>Ztráta (%)</th>
                            <th>Váha bedny (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kfcProducts.map(product => (
                            <tr key={product.id}>
                                <td><strong>{product.name}</strong></td>
                                <td>
                                    <select
                                        value={compositions[product.id]?.baseSurovinaId || ''}
                                        onChange={e => handleChange(product.id, 'baseSurovinaId', e.target.value)}
                                    >
                                        <option value="">-- Vyberte surovinu --</option>
                                        {rawMaterials.map(material => (
                                            <option key={material.id} value={material.id}>
                                                {material.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        style={{ width: '100px' }}
                                        value={compositions[product.id]?.lossPercent || 0}
                                        onChange={e => handleChange(product.id, 'lossPercent', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        style={{ width: '100px' }}
                                        value={((kfcBoxWeights[product.id] || 0) / 1000).toFixed(3)}
                                        onChange={e => handleWeightChange(product.id, e.target.value)}
                                        disabled={!kfcId}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

export default KfcCompositionModal;
