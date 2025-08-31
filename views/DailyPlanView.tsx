import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { isKfcSurovinaByName, BOXES_PER_PALETTE } from '../constants';

interface DailyPlanViewProps {
    getDailyNeeds: (date: string, filter?: 'kfc' | 'non-kfc' | null) => { [key: string]: number };
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
}

const DailyPlanView: React.FC<DailyPlanViewProps> = ({ getDailyNeeds, selectedDate, appData, setAppData }) => {
    
    const todayNeeds = useMemo(() => {
        const nonKfcNeeds = getDailyNeeds(selectedDate, 'non-kfc');
        const kfcNeeds = getDailyNeeds(selectedDate, 'kfc');
        const totalNeeds: { [key: string]: number } = { ...nonKfcNeeds };

        Object.keys(kfcNeeds).forEach(surovinaId => {
            totalNeeds[surovinaId] = (totalNeeds[surovinaId] || 0) + kfcNeeds[surovinaId];
        });
        
        return totalNeeds;
    }, [getDailyNeeds, selectedDate, appData]);
    
    const tomorrow = useMemo(() => {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.toISOString().split('T')[0];
    }, [selectedDate]);

    const tomorrowNeeds = useMemo(() => {
        const nonKfcNeeds = getDailyNeeds(tomorrow, 'non-kfc');
        const kfcNeeds = getDailyNeeds(tomorrow, 'kfc');
        const totalNeeds: { [key: string]: number } = { ...nonKfcNeeds };
        
        Object.keys(kfcNeeds).forEach(surovinaId => {
            totalNeeds[surovinaId] = (totalNeeds[surovinaId] || 0) + kfcNeeds[surovinaId];
        });

        return totalNeeds;
    }, [getDailyNeeds, tomorrow, appData]);

    const handleStockChange = (surovinaId: string, field: 'stock' | 'stockBoxes', value: number) => {
        setAppData(prevData => ({
            ...prevData,
            suroviny: prevData.suroviny.map(s => {
                if (s.id === surovinaId) {
                    return { ...s, [field]: value >= 0 ? value : 0 };
                }
                return s;
            })
        }));
    };

    return (
        <div>
            <h1 className="page-header">Denní Plán</h1>
            <div className="card">
                <div className="card-header"><h2 className="card-title">Přehled Surovin na Den</h2></div>
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Surovina</th>
                                    <th>Skladem (Palety / Bedny)</th>
                                    <th>Potřeba (kg)</th>
                                    <th>Chybí / Přebývá (palet)</th>
                                    <th>Následující den (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appData.suroviny.filter(s => (s.isActive ?? true) && !s.isMix && !isKfcSurovinaByName(s.name)).map(s => {
                                    const neededKg = todayNeeds[s.id] || 0;
                                    const neededPalettes = s.paletteWeight > 0 ? (neededKg / s.paletteWeight) : 0;
                                    const totalStockInPalettes = (s.stock || 0) + ((s.stockBoxes || 0) / BOXES_PER_PALETTE);
                                    const balancePalettes = totalStockInPalettes - neededPalettes;

                                    return (
                                        <tr key={s.id}>
                                            <td>{s.name}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="number" 
                                                        value={s.stock || 0} 
                                                        onChange={e => handleStockChange(s.id, 'stock', parseInt(e.target.value) || 0)}
                                                        style={{ width: '80px' }}
                                                        aria-label={`Skladem palet pro ${s.name}`}
                                                    />
                                                     <span style={{ color: 'var(--dz-text-secondary)'}}>/</span>
                                                    <input 
                                                        type="number" 
                                                        value={s.stockBoxes || 0} 
                                                        onChange={e => handleStockChange(s.id, 'stockBoxes', parseInt(e.target.value) || 0)}
                                                        style={{ width: '80px' }}
                                                        aria-label={`Skladem beden pro ${s.name}`}
                                                    />
                                                </div>
                                            </td>
                                            <td>{neededKg.toFixed(2)} kg</td>
                                            <td>
                                                {balancePalettes < -0.01 ? (
                                                    <span className="shortage">- {Math.ceil(Math.abs(balancePalettes))}</span>
                                                ) : (
                                                    <span className="surplus">+ {Math.floor(balancePalettes)}</span>
                                                )}
                                            </td>
                                            <td>{(tomorrowNeeds[s.id] || 0).toFixed(2)} kg</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-header"><h2 className="card-title">Kalibr</h2></div>
                <div className="card-content">
                    <p>Zde bude tabulka kalibrace.</p>
                </div>
            </div>
        </div>
    );
};

export default DailyPlanView;