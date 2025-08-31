import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { isKfcSurovinaByName } from '../constants';

interface KFCViewProps {
    getDailyNeeds: (date: string, filter?: 'kfc' | 'non-kfc' | null) => { [key: string]: number };
    selectedDate: string;
    appData: AppState;
    setModal: (modal: any) => void;
}

const KFCView: React.FC<KFCViewProps> = ({ getDailyNeeds, selectedDate, appData, setModal }) => {
    
    const todayNeeds = useMemo(() => getDailyNeeds(selectedDate, 'kfc'), [getDailyNeeds, selectedDate, appData]);
    
    const tomorrow = useMemo(() => {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.toISOString().split('T')[0];
    }, [selectedDate]);

    const tomorrowNeeds = useMemo(() => getDailyNeeds(tomorrow, 'kfc'), [getDailyNeeds, tomorrow, appData]);
    
    const requiredRawMaterials = useMemo(() => {
        const materialIds = new Set<string>();
        Object.values(appData.kfcCompositions).forEach(comp => {
            if (comp.baseSurovinaId) {
                materialIds.add(comp.baseSurovinaId);
            }
        });
        return appData.suroviny.filter(s => materialIds.has(s.id));
    }, [appData.kfcCompositions, appData.suroviny]);

    const kfcProducts = useMemo(() => appData.suroviny.filter(s => isKfcSurovinaByName(s.name)), [appData.suroviny]);
    const kfcId = useMemo(() => appData.zakaznici.find(c => c.name.toLowerCase() === 'kfc')?.id, [appData.zakaznici]);

    const getOrderedBoxes = (date: string) => {
        if (!kfcId) return {};
        const orders = appData.orders.filter(o => o.customerId === kfcId && o.date === date);
        const boxCounts: { [surovinaId: string]: number } = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                boxCounts[item.surovinaId] = (boxCounts[item.surovinaId] || 0) + item.boxCount;
            });
        });
        return boxCounts;
    };
    
    const todayOrderedBoxes = useMemo(() => getOrderedBoxes(selectedDate), [selectedDate, appData.orders, kfcId]);
    const tomorrowOrderedBoxes = useMemo(() => getOrderedBoxes(tomorrow), [tomorrow, appData.orders, kfcId]);


    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{marginBottom: 0}}>KFC Plán</h1>
                <div style={{display: 'flex', gap: '12px'}}>
                    <button className="btn btn-primary" onClick={() => setModal({ name: 'kfcComposition' })}>
                        Upravit složení
                    </button>
                    <button className="btn btn-success" onClick={() => setModal({ name: 'addKfcOrder' })}>
                        + Přidat objednávku
                    </button>
                </div>
            </div>
             <div className="card">
                <div className="card-header"><h2 className="card-title">Objednávky KFC produktů</h2></div>
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>KFC Produkt</th>
                                    <th>Objednáno beden (dnes)</th>
                                    <th>Objednáno beden (zítra)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kfcProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{todayOrderedBoxes[p.id] || 0}</td>
                                        <td>{tomorrowOrderedBoxes[p.id] || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-header"><h2 className="card-title">Potřeba základních surovin</h2></div>
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Základní surovina</th>
                                    <th>Potřeba (kg)</th>
                                    <th>Potřeba (palet)</th>
                                    <th>Následující den (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requiredRawMaterials.length > 0 ? requiredRawMaterials.map(s => {
                                    const neededKg = todayNeeds[s.id] || 0;
                                    const neededPalettes = s.paletteWeight > 0 ? Math.ceil(neededKg / s.paletteWeight) : 0;
                                    return (
                                        <tr key={s.id}>
                                            <td>{s.name}</td>
                                            <td>{neededKg.toFixed(2)} kg</td>
                                            <td>{neededPalettes}</td>
                                            <td>{(tomorrowNeeds[s.id] || 0).toFixed(2)} kg</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={4}>Nejprve definujte složení KFC produktů v sekci "Upravit složení".</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KFCView;