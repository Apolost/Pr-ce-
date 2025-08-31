import React, { useState } from 'react';
import type { AppState, Order } from '../../types';
import { isKfcSurovinaByName } from '../../constants';
import { IconEdit } from '../../App';

interface BoxWeightsViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    setModal: (modal: any) => void;
}

const BoxWeightsView: React.FC<BoxWeightsViewProps> = ({ appData, setAppData, showToast, setModal }) => {
    const [activeTab, setActiveTab] = useState<Order['orderType']>('standard');

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

    const renderWeightsTable = () => (
        appData.zakaznici.filter(c => c.name.toLowerCase() !== 'kfc').map(customer => (
            <details key={`${customer.id}-${activeTab}`} className="accordion-item" open>
                <summary>
                    <span className="summary-title">{customer.name}</span>
                    <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </summary>
                <div className="accordion-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Produkt</th>
                                    <th>Váha bedny (kg)</th>
                                    <th className="actions">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appData.suroviny.filter(s => !isKfcSurovinaByName(s.name)).map(surovina => {
                                    const weightInGrams = appData.boxWeights[customer.id]?.[activeTab]?.[surovina.id] || 0;
                                    const weightInKg = (weightInGrams / 1000).toFixed(3);
                                    
                                    return (
                                        <tr key={surovina.id} style={{ opacity: (surovina.isActive ?? true) ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                            <td style={{ textDecoration: (surovina.isActive ?? true) ? 'none' : 'line-through' }}>
                                                {surovina.name}
                                            </td>
                                            <td>
                                                {weightInKg} kg
                                            </td>
                                            <td className="actions" style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setModal({ name: 'editProduct', surovinaId: surovina.id, customerId: customer.id, orderType: activeTab })}
                                                    disabled={!(surovina.isActive ?? true)}
                                                    aria-label={`Upravit ${surovina.name}`}
                                                >
                                                    <IconEdit />
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${(surovina.isActive ?? true) ? 'btn-danger' : 'btn-success'}`}
                                                    style={{width: '110px'}}
                                                    onClick={() => handleToggleSurovinaActive(surovina.id)}
                                                >
                                                    {(surovina.isActive ?? true) ? 'Deaktivovat' : 'Aktivovat'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </details>
        ))
    );

    return (
         <div>
            <h1 className="page-header">Úprava produktu</h1>
            <p style={{marginTop: '-16px', marginBottom: '24px', color: 'var(--text-secondary)'}}>
                Spravujte názvy, váhy, aktivaci a deaktivaci produktů pro jednotlivé zákazníky.
            </p>
            <div className="card">
                <div className="tabs-nav">
                    <button 
                        className={`tab-button ${activeTab === 'standard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('standard')}
                    >
                        OA RB
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'extra' ? 'active' : ''}`}
                        onClick={() => setActiveTab('extra')}
                    >
                        Extra
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'bulk' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bulk')}
                    >
                        Volně ložené
                    </button>
                </div>
                <div className="card-content">
                    {renderWeightsTable()}
                </div>
            </div>
        </div>
    );
};

export default BoxWeightsView;
