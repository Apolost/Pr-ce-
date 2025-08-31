import React, { useState } from 'react';
import Modal from '../components/Modal';
import type { AppState, Surovina } from '../types';
import { isKfcSurovinaByName } from '../constants';

interface QuickStockModalProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const QuickStockModal: React.FC<QuickStockModalProps> = ({ appData, setAppData, showToast, onClose }) => {
    const [stockData, setStockData] = useState<Record<string, { stock: number, stockBoxes: number }>>(() => {
        const initialState: Record<string, { stock: number, stockBoxes: number }> = {};
        appData.suroviny.forEach(s => {
            initialState[s.id] = { stock: s.stock || 0, stockBoxes: s.stockBoxes || 0 };
        });
        return initialState;
    });

    const handleStockChange = (surovinaId: string, field: 'stock' | 'stockBoxes', value: number) => {
        setStockData(prev => ({
            ...prev,
            [surovinaId]: {
                ...prev[surovinaId],
                [field]: value < 0 ? 0 : value
            }
        }));
    };
    
    const handleSave = () => {
        setAppData(prev => {
            const updatedSuroviny = prev.suroviny.map(s => {
                if (stockData[s.id]) {
                    return {
                        ...s,
                        stock: stockData[s.id].stock,
                        stockBoxes: stockData[s.id].stockBoxes
                    };
                }
                return s;
            });
            return { ...prev, suroviny: updatedSuroviny };
        });
        showToast('Stav skladu byl aktualizován.');
        onClose();
    };

    const relevantSuroviny = appData.suroviny.filter(s => !s.isMix && !isKfcSurovinaByName(s.name));

    return (
        <Modal
            title="Rychlé zadání skladu"
            onClose={onClose}
            maxWidth="700px"
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit změny</button></>}
        >
            <div className="table-responsive-wrapper" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Surovina</th>
                            <th>Palety</th>
                            <th>Bedny</th>
                        </tr>
                    </thead>
                    <tbody>
                        {relevantSuroviny.map(s => (
                            <tr key={s.id}>
                                <td>{s.name}</td>
                                <td>
                                    <input 
                                        type="number" 
                                        value={stockData[s.id]?.stock || 0} 
                                        onChange={e => handleStockChange(s.id, 'stock', parseInt(e.target.value, 10) || 0)}
                                        style={{ width: '80px' }}
                                        aria-label={`Skladem palet pro ${s.name}`}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        value={stockData[s.id]?.stockBoxes || 0} 
                                        onChange={e => handleStockChange(s.id, 'stockBoxes', parseInt(e.target.value, 10) || 0)}
                                        style={{ width: '80px' }}
                                        aria-label={`Skladem beden pro ${s.name}`}
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

export default QuickStockModal;
