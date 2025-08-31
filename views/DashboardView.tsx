import React, { useMemo, useState } from 'react';
import type { AppState, Product } from '../types';
import { isKfcSurovinaByName, BOXES_PER_PALETTE } from '../constants';
import { IconEdit, IconTrash, IconPlus } from '../App';

interface DashboardViewProps {
    getDailyNeeds: (date: string, filter?: 'kfc' | 'non-kfc' | null) => { [key: string]: number };
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    setModal: (modal: any) => void;
    setActiveView: (view: string) => void;
    getCustomerName: (id: string) => string;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

interface SpizyOrderGroup {
    customerId: string;
    customerName: string;
    items: {
        surovinaId: string;
        productName: string;
        boxCount: number;
    }[];
}


const DashboardView: React.FC<DashboardViewProps> = ({ getDailyNeeds, selectedDate, appData, setAppData, setModal, setActiveView, getCustomerName, showToast, showConfirmation }) => {
    
    const missingSuroviny = useMemo(() => {
        const totalNeeds = getDailyNeeds(selectedDate);
        const missing: { surovina: AppState['suroviny'][0], missingKg: number, missingPalettes: number }[] = [];

        appData.suroviny.filter(s => (s.isActive ?? true) && !s.isMix && !isKfcSurovinaByName(s.name)).forEach(s => {
            const neededKg = totalNeeds[s.id] || 0;
            const boxWeightKg = s.paletteWeight > 0 ? s.paletteWeight / BOXES_PER_PALETTE : 0;
            const stockKg = ((s.stock || 0) * s.paletteWeight) + ((s.stockBoxes || 0) * boxWeightKg);
            const balanceKg = stockKg - neededKg;

            if (balanceKg < 0) {
                const missingKg = Math.abs(balanceKg);
                const missingPalettes = s.paletteWeight > 0 ? (missingKg / s.paletteWeight) : 0;
                missing.push({ surovina: s, missingKg, missingPalettes: Math.ceil(missingPalettes) });
            }
        });

        return missing;
    }, [selectedDate, appData, getDailyNeeds]);
    
    const spizyOrdersGrouped = useMemo(() => {
        const spizySuroviny = appData.suroviny.filter(s => s.name.toUpperCase().includes('ŠPÍZY'));
        const spizySurovinaIds = spizySuroviny.map(s => s.id);
        if (spizySurovinaIds.length === 0) return [];
    
        const ordersForDay = appData.orders.filter(o => o.date === selectedDate);
        const grouped: Record<string, SpizyOrderGroup> = {};
    
        ordersForDay.forEach(order => {
            const spizyItems = order.items.filter(item => spizySurovinaIds.includes(item.surovinaId));
            if (spizyItems.length > 0) {
                if (!grouped[order.customerId]) {
                    grouped[order.customerId] = {
                        customerId: order.customerId,
                        customerName: getCustomerName(order.customerId),
                        items: []
                    };
                }
                spizyItems.forEach(item => {
                    grouped[order.customerId].items.push({
                        surovinaId: item.surovinaId,
                        productName: appData.suroviny.find(s => s.id === item.surovinaId)?.name || 'N/A',
                        boxCount: item.boxCount
                    });
                });
            }
        });
    
        return Object.values(grouped);
    }, [appData, selectedDate, getCustomerName]);
    
    const sortedSpizyOrders = useMemo(() => {
        const spizyStatusForDate = appData.spizyOrdersStatus?.[selectedDate] || {};
        return [...spizyOrdersGrouped].sort((a, b) => {
            const aDone = spizyStatusForDate[a.customerId] || false;
            const bDone = spizyStatusForDate[b.customerId] || false;
            if (aDone === bDone) return 0;
            return aDone ? 1 : -1;
        });
    }, [spizyOrdersGrouped, appData.spizyOrdersStatus, selectedDate]);


    const handleDeleteSpizyOrder = (customerId: string) => {
        showConfirmation(`Opravdu chcete smazat všechny objednávky špízů pro zákazníka ${getCustomerName(customerId)} na tento den?`, () => {
            setAppData(prev => {
                const spizySurovinaIds = prev.suroviny
                    .filter(s => s.name.toUpperCase().includes('ŠPÍZY'))
                    .map(s => s.id);
    
                const newOrders = prev.orders.map(order => {
                    if (order.customerId === customerId && order.date === selectedDate) {
                        const newItems = order.items.filter(item => !spizySurovinaIds.includes(item.surovinaId));
                        return { ...order, items: newItems };
                    }
                    return order;
                }).filter(order => order.items.length > 0);
    
                return { ...prev, orders: newOrders };
            });
            showToast('Objednávka špízů smazána.');
        });
    };

    const handleToggleSpizyStatus = (customerId: string) => {
        const isCurrentlyDone = appData.spizyOrdersStatus?.[selectedDate]?.[customerId] || false;
    
        // Logic to run when marking an order as 'done'
        if (!isCurrentlyDone) {
            // 1. Define skewer types and the required raw material ('ŘÍZKY')
            const spizySurovinaIds = new Set(
                appData.suroviny
                    .filter(s => s.name.toUpperCase().includes('ŠPÍZY'))
                    .map(s => s.id)
            );
            const RIZKY_ID = 's01';
            const rizkySurovina = appData.suroviny.find(s => s.id === RIZKY_ID);
    
            if (!rizkySurovina) {
                showToast("Chyba: Surovina 'ŘÍZKY' (s01) nebyla nalezena v systému.", 'error');
                return;
            }
    
            // 2. Calculate the total weight of skewers for the specified customer and date.
            const ordersForCustomer = appData.orders.filter(o => o.customerId === customerId && o.date === selectedDate);
            let totalRequiredKg = 0;
            ordersForCustomer.forEach(order => {
                order.items.forEach(item => {
                    if (spizySurovinaIds.has(item.surovinaId)) {
                        // Assuming 'standard' box weights for skewers, as defined in other parts of the app.
                        const boxWeightG = appData.boxWeights[order.customerId]?.standard?.[item.surovinaId] || 10000;
                        totalRequiredKg += item.boxCount * (boxWeightG / 1000);
                    }
                });
            });
    
            // 3. Update the state: deduct stock and mark the order as done.
            setAppData(prev => {
                let suroviny = [...prev.suroviny];
    
                if (totalRequiredKg > 0) {
                    const rizkyIndex = suroviny.findIndex(s => s.id === RIZKY_ID);
                    const rizky = suroviny[rizkyIndex];
                    
                    const boxWeightKg = rizky.paletteWeight > 0 ? rizky.paletteWeight / BOXES_PER_PALETTE : 0;
    
                    if (boxWeightKg > 0) {
                        const currentTotalStockKg = (rizky.stock * rizky.paletteWeight) + ((rizky.stockBoxes || 0) * boxWeightKg);
                        const newTotalStockKg = currentTotalStockKg - totalRequiredKg;
    
                        let newPallets = 0;
                        let newBoxes = 0;
    
                        if (newTotalStockKg > 0) {
                            newPallets = Math.floor(newTotalStockKg / rizky.paletteWeight);
                            const remainingKg = newTotalStockKg % rizky.paletteWeight;
                            newBoxes = Math.round(remainingKg / boxWeightKg);
                        }
    
                        suroviny[rizkyIndex] = { ...rizky, stock: newPallets, stockBoxes: newBoxes };
                    }
                }
    
                // Mark the order as done
                const newStatus = JSON.parse(JSON.stringify(prev.spizyOrdersStatus || {}));
                if (!newStatus[selectedDate]) {
                    newStatus[selectedDate] = {};
                }
                newStatus[selectedDate][customerId] = true;
    
                return { ...prev, suroviny, spizyOrdersStatus: newStatus };
            });
    
            if (totalRequiredKg > 0) {
                showToast(`Sklad 'ŘÍZKY' snížen o ${totalRequiredKg.toFixed(2)} kg.`);
            }
    
        } else {
            // Logic to run when un-marking an order (marking as not done)
            // This does not add stock back, just toggles the status.
            setAppData(prev => {
                const newStatus = JSON.parse(JSON.stringify(prev.spizyOrdersStatus || {}));
                if (newStatus[selectedDate]) {
                    newStatus[selectedDate][customerId] = false;
                }
                return { ...prev, spizyOrdersStatus: newStatus };
            });
        }
    };

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

    interface ProductionTarget {
        kg: string;
        done: boolean;
    }

    const initialTargets: Record<string, ProductionTarget> = {
        's08': { kg: '0', done: false }, // Čtvrtky
        's06': { kg: '0', done: false }, // Stehna (using Horní Stehna)
        's09': { kg: '0', done: false }, // Křídla
    };

    const [productionTargets, setProductionTargets] = useState<Record<string, ProductionTarget>>(initialTargets);
     const chiliMangoSpizyOrderKg = useMemo(() => {
        const chiliMangoSurovina = appData.suroviny.find(s => s.name.toUpperCase() === 'ŠPÍZY - ČILI MANGO');
        if (!chiliMangoSurovina) return 0;
        
        return appData.orders
            .filter(o => o.date === selectedDate)
            .flatMap(o => o.items.map(item => ({...item, customerId: o.customerId})))
            .filter(item => item.surovinaId === chiliMangoSurovina.id)
            .reduce((totalKg, item) => {
                const boxWeightG = appData.boxWeights[item.customerId]?.standard?.[item.surovinaId] || 10000;
                return totalKg + (item.boxCount * (boxWeightG / 1000));
            }, 0);
    }, [appData, selectedDate]);
    
    const extraProductionTargets = useMemo(() => {
        const targetMap = new Map<string, { product: Product, totalKg: number }>();
        const extraProducts = appData.products.filter(p => p.isExtra);
        if (extraProducts.length === 0) return [];
    
        const ordersForDay = appData.orders.filter(o => o.date === selectedDate);
        
        for (const order of ordersForDay) {
            for (const item of order.items) {
                const product = extraProducts.find(p => p.surovinaId === item.surovinaId && p.customerId === order.customerId);
                if (product) {
                    const boxWeightG = product.boxWeight > 0 ? product.boxWeight : (appData.boxWeights[order.customerId]?.[order.orderType]?.[item.surovinaId] || 10000);
                    const weightKg = item.boxCount * (boxWeightG / 1000);
    
                    const existingTarget = targetMap.get(product.id);
                    if (existingTarget) {
                        existingTarget.totalKg += weightKg;
                    } else {
                        targetMap.set(product.id, { product, totalKg: weightKg });
                    }
                }
            }
        }
    
        return Array.from(targetMap.values());
    }, [appData, selectedDate]);
    
    const handleExtraTargetDoneToggle = (productId: string) => {
        setAppData(prev => {
            const newStatus = JSON.parse(JSON.stringify(prev.extraProductionStatus || {}));
            if (!newStatus[selectedDate]) {
                newStatus[selectedDate] = {};
            }
            newStatus[selectedDate][productId] = !newStatus[selectedDate][productId];
            return { ...prev, extraProductionStatus: newStatus };
        });
    };

    const handleTargetKgChange = (surovinaId: string, kg: string) => {
        setProductionTargets(prev => ({ ...prev, [surovinaId]: { ...(prev[surovinaId] || { kg: '0', done: false }), kg } }));
    };

    const handleTargetDoneToggle = (surovinaId: string) => {
        setProductionTargets(prev => ({ ...prev, [surovinaId]: { ...(prev[surovinaId] || { kg: '0', done: false }), done: !prev[surovinaId]?.done } }));
    };

    const targetSurovinyIds = ['s08', 's06', 's09'];
    const surovinaNameMap: Record<string, string> = { 
        's08': 'Čtvrtky 320g', 's06': 'Stehna 240g', 's09': 'Křídla se špičkou', 's01': 'Řízky čili mango'
    };
    
    return (
        <div>
            <div className="page-header-container">
                 <h1 className="page-header" style={{ marginBottom: 0 }}>Hlavní stránka</h1>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setModal({ name: 'quickStock' })}>Sklad</button>
                    <button className="btn btn-primary" onClick={() => setActiveView('orders')}><IconPlus /> Přidat objednávku</button>
                 </div>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
                <div className="widget widget-full-width">
                    <div className="widget-header">
                        <h2 className="widget-title">Cíle výroby</h2>
                    </div>
                    <div className="widget-content">
                        <div className="production-targets-grid" style={{display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'}}>
                            {chiliMangoSpizyOrderKg > 0 && (() => {
                                const surovinaId = 's01'; // Řízky
                                const kg = chiliMangoSpizyOrderKg;
                                const boxes = Math.ceil(kg / 20);
                                return (
                                    <div className="production-target-card" style={{
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-muted)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <h3 style={{fontSize: '1rem', fontWeight: 600, margin: 0, textAlign: 'center'}}>{surovinaNameMap[surovinaId]}</h3>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1}}>
                                            <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '2px'}}>Potřeba (kg)</label>
                                                <input type="number" value={kg.toFixed(2)} readOnly style={{padding: '6px 8px', fontSize: '0.9rem'}}/>
                                            </div>
                                            <div style={{textAlign: 'center', flex: 1}}>
                                                <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Potřeba beden</div>
                                                <div style={{color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: 700}}>{boxes}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            {targetSurovinyIds.map(surovinaId => {
                                const target = productionTargets[surovinaId] || { kg: '0', done: false };
                                const boxes = Math.ceil(Number(target.kg) / 20);
                                return (
                                    <div key={surovinaId} className="production-target-card" style={{ 
                                        padding: '12px', 
                                        borderRadius: 'var(--radius-md)', 
                                        background: target.done ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-muted)',
                                        border: target.done ? '1px solid var(--accent-success)' : '1px solid transparent',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <h3 style={{fontSize: '1rem', fontWeight: 600, margin: 0, textAlign: 'center'}}>{surovinaNameMap[surovinaId]}</h3>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1}}>
                                            <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '2px'}}>Objednávka (kg)</label>
                                                <input type="number" value={target.kg} onChange={(e) => handleTargetKgChange(surovinaId, e.target.value)} style={{padding: '6px 8px', fontSize: '0.9rem'}}/>
                                            </div>
                                            <div style={{textAlign: 'center', flex: 1}}>
                                                <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Potřeba beden</div>
                                                <div style={{color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: 700}}>{boxes}</div>
                                            </div>
                                        </div>
                                        <button className={`btn btn-sm ${target.done ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleTargetDoneToggle(surovinaId)} style={{width: '100%'}}>{target.done ? 'Zrušit hotovo' : 'Hotovo'}</button>
                                    </div>
                                );
                            })}
                            {extraProductionTargets.map(({ product, totalKg }) => {
                                const isDone = appData.extraProductionStatus?.[selectedDate]?.[product.id] || false;
                                const boxes = Math.ceil(totalKg / 20);
                                return (
                                    <div key={product.id} className="production-target-card" style={{ 
                                        padding: '12px', 
                                        borderRadius: 'var(--radius-md)', 
                                        background: isDone ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-muted)',
                                        border: isDone ? '1px solid var(--accent-success)' : '1px solid transparent',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <h3 style={{fontSize: '1rem', fontWeight: 600, margin: 0, textAlign: 'center'}}>{product.name}</h3>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1}}>
                                            <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '2px'}}>Potřeba (kg)</label>
                                                <input type="number" value={totalKg.toFixed(2)} readOnly style={{padding: '6px 8px', fontSize: '0.9rem'}}/>
                                            </div>
                                            <div style={{textAlign: 'center', flex: 1}}>
                                                <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Potřeba beden</div>
                                                <div style={{color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: 700}}>{boxes}</div>
                                            </div>
                                        </div>
                                        <button className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleExtraTargetDoneToggle(product.id)} style={{width: '100%'}}>{isDone ? 'Zrušit hotovo' : 'Hotovo'}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="widget widget-full-width">
                     <div className="widget-header">
                        <h2 className="widget-title">Objednávky na Špízy</h2>
                        <button className="btn btn-success" onClick={() => setModal({ name: 'addSpizyOrder' })}>+ Přidat</button>
                    </div>
                    <div className="widget-content">
                    {sortedSpizyOrders.length > 0 ? (
                        sortedSpizyOrders.map(group => {
                            const isDone = appData.spizyOrdersStatus?.[selectedDate]?.[group.customerId] || false;
                            return (
                                <div key={group.customerId} style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{group.customerName}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <button className={`btn btn-sm ${isDone ? 'btn-success' : 'btn-secondary'}`} onClick={() => handleToggleSpizyStatus(group.customerId)}>
                                                {isDone ? 'Hotovo' : 'Označit jako hotové'}
                                            </button>
                                            <button className="btn-icon" title="Upravit objednávku" onClick={() => setModal({ name: 'editSpizyOrder', customerId: group.customerId })}><IconEdit /></button>
                                            <button className="btn-icon danger" title="Smazat objednávku" onClick={() => handleDeleteSpizyOrder(group.customerId)}><IconTrash /></button>
                                        </div>
                                    </div>
                                    <div className="table-responsive-wrapper">
                                        <table className="data-table">
                                            <thead><tr><th>Produkt</th><th>Počet beden</th></tr></thead>
                                            <tbody>
                                                {group.items.map((item, index) => (
                                                    <tr key={`${item.surovinaId}-${index}`}><td>{item.productName}</td><td>{item.boxCount}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })
                    ) : ( <p>Pro tento den nejsou žádné objednávky na špízy.</p> )}
                    </div>
                </div>

                 <div className="widget widget-full-width">
                     <div className="widget-header">
                        <h2 className="widget-title">Chybějící suroviny na den: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('cs-CZ')}</h2>
                    </div>
                     <div className="widget-content">
                         {missingSuroviny.length > 0 ? (
                             <div className="table-responsive-wrapper">
                                 <table className="data-table">
                                     <thead>
                                        <tr>
                                            <th>Surovina</th>
                                            <th>Chybí (kg / palet)</th>
                                            <th>Skladem (Palety / Bedny)</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                         {missingSuroviny.map(({ surovina, missingKg, missingPalettes }) => (
                                             <tr key={surovina.id}>
                                                 <td>{surovina.name}</td>
                                                 <td className="shortage">{missingKg.toFixed(2)} kg / {missingPalettes} pal.</td>
                                                 <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input 
                                                            type="number" 
                                                            value={surovina.stock || 0} 
                                                            onChange={e => handleStockChange(surovina.id, 'stock', parseInt(e.target.value) || 0)}
                                                            style={{ width: '80px' }}
                                                            aria-label={`Skladem palet pro ${surovina.name}`}
                                                        />
                                                        <span style={{ color: 'var(--text-secondary)'}}>/</span>
                                                        <input 
                                                            type="number" 
                                                            value={surovina.stockBoxes || 0} 
                                                            onChange={e => handleStockChange(surovina.id, 'stockBoxes', parseInt(e.target.value) || 0)}
                                                            style={{ width: '80px' }}
                                                            aria-label={`Skladem beden pro ${surovina.name}`}
                                                        />
                                                    </div>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         ) : ( <p>Nic nechybí, vše je v pořádku!</p> )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default DashboardView;