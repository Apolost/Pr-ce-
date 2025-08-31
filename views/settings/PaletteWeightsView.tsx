import React, { useState, useEffect } from 'react';
import type { AppState, Surovina } from '../../types';
import { isKfcSurovinaByName } from '../../constants';

interface PaletteWeightsViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const PaletteWeightsView: React.FC<PaletteWeightsViewProps> = ({ appData, setAppData, showToast }) => {
    const [weights, setWeights] = useState<{[key: string]: number}>({});

    useEffect(() => {
        const initialWeights = appData.suroviny.reduce((acc, s) => {
            acc[s.id] = s.paletteWeight;
            return acc;
        }, {} as {[key: string]: number});
        setWeights(initialWeights);
    }, [appData.suroviny]);
    
    const handleWeightChange = (surovinaId: string, value: string) => {
        setWeights(prev => ({
            ...prev,
            [surovinaId]: parseFloat(value) || 0
        }));
    };

    const handleSaveChanges = () => {
        setAppData(prev => ({
            ...prev,
            suroviny: prev.suroviny.map(s => ({
                ...s,
                paletteWeight: weights[s.id] || s.paletteWeight
            }))
        }));
        showToast('Váhy palet uloženy');
    };
    
    const handleToggleSurovinaActive = (surovinaId: string) => {
        const surovina = appData.suroviny.find(s => s.id === surovinaId);
        if (surovina && isKfcSurovinaByName(surovina.name)) {
            showToast('KFC produkty nelze deaktivovat.', 'error');
            return;
        }

        setAppData(prev => ({
            ...prev,
            suroviny: prev.suroviny.map(s =>
                s.id === surovinaId ? { ...s, isActive: !(s.isActive ?? true) } : s
            )
        }));

        if (surovina) {
            showToast(`Produkt "${surovina.name}" byl ${(surovina.isActive ?? true) ? 'deaktivován' : 'aktivován'}.`);
        }
    };

    return (
        <div>
            <h1 className="page-header">Váhy palet</h1>
            <div className="card">
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Surovina</th>
                                    <th>Váha palety (kg)</th>
                                    <th className="actions">Stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appData.suroviny.filter(s => !s.isMix && !isKfcSurovinaByName(s.name)).map(surovina => (
                                    <tr key={surovina.id} style={{ opacity: (surovina.isActive ?? true) ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                        <td style={{ textDecoration: (surovina.isActive ?? true) ? 'none' : 'line-through' }}>
                                            {surovina.name}
                                        </td>
                                        <td>
                                            <input 
                                                type="number"
                                                value={weights[surovina.id] || 0}
                                                onChange={e => handleWeightChange(surovina.id, e.target.value)}
                                                style={{ width: '120px' }}
                                                disabled={!(surovina.isActive ?? true)}
                                            />
                                        </td>
                                        <td className="actions">
                                            <button
                                                className={`btn btn-sm ${(surovina.isActive ?? true) ? 'btn-danger' : 'btn-success'}`}
                                                style={{width: '110px'}}
                                                onClick={() => handleToggleSurovinaActive(surovina.id)}
                                            >
                                                {(surovina.isActive ?? true) ? 'Deaktivovat' : 'Aktivovat'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <button className="btn btn-primary" onClick={handleSaveChanges}>Uložit všechny změny</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaletteWeightsView;