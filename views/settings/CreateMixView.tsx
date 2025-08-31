import React, { useState, useEffect } from 'react';
import type { AppState, MixDefinition } from '../../types';
import { isKfcSurovinaByName } from '../../constants';
import { IconTrash, IconEdit } from '../../App';

const generateId = () => crypto.randomUUID();

interface CreateMixViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

interface ComponentState {
    surovinaId: string;
    percentage: number;
    loss: number;
}

const CreateMixView: React.FC<CreateMixViewProps> = ({ appData, setAppData, showToast, showConfirmation }) => {
    const [editingMixId, setEditingMixId] = useState<string | null>(null);
    const [mixName, setMixName] = useState('');
    const [components, setComponents] = useState<ComponentState[]>([]);

    const rawMaterials = appData.suroviny.filter(s => (s.isActive ?? true) && !s.isMix && !isKfcSurovinaByName(s.name));

    useEffect(() => {
        if (!editingMixId) {
            resetForm();
        } else {
            const mix = appData.suroviny.find(s => s.id === editingMixId);
            const mixDef = appData.mixDefinitions[editingMixId];
            if (mix && mixDef) {
                setMixName(mix.name);
                setComponents(mixDef.components.map(c => ({...c, loss: c.loss || 0})));
            }
        }
    }, [editingMixId, appData]);
    
    const resetForm = () => {
        setEditingMixId(null);
        setMixName('');
        setComponents([{ surovinaId: rawMaterials[0]?.id || '', percentage: 100, loss: 0 }]);
    };
    
    const handleAddComponent = () => {
        setComponents([...components, { surovinaId: rawMaterials[0]?.id || '', percentage: 0, loss: 0 }]);
    };
    
    const handleRemoveComponent = (index: number) => {
        setComponents(components.filter((_, i) => i !== index));
    };

    const handleComponentChange = (index: number, field: keyof ComponentState, value: string) => {
        const newComponents = [...components];
        if (field === 'surovinaId') {
            (newComponents[index] as any)[field] = value;
        } else {
            (newComponents[index] as any)[field] = parseFloat(value) || 0;
        }
        setComponents(newComponents);
    };
    
    const totalPercentage = components.reduce((sum, comp) => sum + comp.percentage, 0);

    const handleSaveMix = () => {
        if (!mixName.trim()) {
            showToast('Zadejte název mixu.', 'error');
            return;
        }
        if (!editingMixId && appData.suroviny.some(s => s.name.toUpperCase() === mixName.trim().toUpperCase())) {
            showToast('Produkt s tímto názvem již existuje.', 'error');
            return;
        }
        if (components.length === 0) {
            showToast('Mix musí mít alespoň jednu složku.', 'error');
            return;
        }
        if (Math.abs(totalPercentage - 100) > 0.1) {
            showToast('Součet podílů musí být 100%.', 'error');
            return;
        }
        
        setAppData(prev => {
            const newSuroviny = [...prev.suroviny];
            const newMixDefs = {...prev.mixDefinitions};
            const newBoxWeights = JSON.parse(JSON.stringify(prev.boxWeights));
            
            if (editingMixId) {
                const index = newSuroviny.findIndex(s => s.id === editingMixId);
                if (index !== -1) {
                    newSuroviny[index].name = mixName.trim().toUpperCase();
                    newMixDefs[editingMixId] = { components };
                    showToast('Mix upraven');
                }
            } else {
                const newMixId = generateId();
                newSuroviny.push({ id: newMixId, name: mixName.trim().toUpperCase(), paletteWeight: 0, stock: 0, isMix: true, isActive: true });
                newMixDefs[newMixId] = { components };
                // FIX: Correctly initialize box weights for the new mix across all customers and order types.
                prev.zakaznici.forEach(c => {
                    if (!newBoxWeights[c.id]) {
                        newBoxWeights[c.id] = { standard: {}, extra: {}, bulk: {} };
                    }
                    if (!newBoxWeights[c.id].standard) newBoxWeights[c.id].standard = {};
                    if (!newBoxWeights[c.id].extra) newBoxWeights[c.id].extra = {};
                    if (!newBoxWeights[c.id].bulk) newBoxWeights[c.id].bulk = {};

                    newBoxWeights[c.id].standard![newMixId] = 10000;
                    newBoxWeights[c.id].extra![newMixId] = 10000;
                    newBoxWeights[c.id].bulk![newMixId] = 10000;
                });
                showToast('Nový mix uložen');
            }
            return { ...prev, suroviny: newSuroviny, mixDefinitions: newMixDefs, boxWeights: newBoxWeights };
        });
        resetForm();
    };

    const handleDeleteMix = (mixId: string) => {
        showConfirmation('Opravdu chcete smazat tento mix? Bude odstraněn i ze všech objednávek.', () => {
             setAppData(prev => ({
                ...prev,
                suroviny: prev.suroviny.filter(s => s.id !== mixId),
                mixDefinitions: Object.fromEntries(Object.entries(prev.mixDefinitions).filter(([id]) => id !== mixId)),
                orders: prev.orders.map(o => ({...o, items: o.items.filter(i => i.surovinaId !== mixId)})).filter(o => o.items.length > 0)
            }));
            showToast('Mix smazán');
        });
    };

    return (
         <div>
            <h1 className="page-header">{editingMixId ? 'Upravit mix' : 'Vytvořit nový mix'}</h1>
            <div className="card">
                <div className="card-content">
                    <div className="form-group">
                        <label>Název mixu</label>
                        <input type="text" value={mixName} onChange={e => setMixName(e.target.value)} />
                    </div>
                    
                    <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginTop: '24px', marginBottom: '16px'}}>Složení mixu</h3>
                    {components.map((comp, index) => (
                         <div className="form-row" key={index} style={{alignItems: 'flex-end'}}>
                            <div className="form-field" style={{ flex: 3 }}><label>Surovina</label><select value={comp.surovinaId} onChange={e => handleComponentChange(index, 'surovinaId', e.target.value)}>{rawMaterials.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div className="form-field"><label>Podíl (%)</label><input type="number" value={comp.percentage} onChange={e => handleComponentChange(index, 'percentage', e.target.value)} min="0" max="100" step="0.1" /></div>
                            <div className="form-field"><label>Ztráta (%)</label><input type="number" value={comp.loss} onChange={e => handleComponentChange(index, 'loss', e.target.value)} min="0" max="100" step="0.1" /></div>
                            <button className="btn-icon danger" onClick={() => handleRemoveComponent(index)}><IconTrash /></button>
                        </div>
                    ))}
                    <button className="btn btn-secondary" onClick={handleAddComponent} style={{ marginTop: '20px' }}>+ Přidat surovinu</button>
                    <div style={{ fontWeight: 'bold', marginTop: '20px', fontSize: '1.1rem'}}>
                        Celkem: <span style={{ color: Math.abs(totalPercentage - 100) > 0.1 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{totalPercentage.toFixed(1)}</span>%
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                         {editingMixId && <button className="btn btn-secondary" onClick={resetForm}>Zrušit úpravu</button>}
                        <button className="btn btn-primary" onClick={handleSaveMix}>Uložit mix</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h2 className="card-title">Existující mixy</h2></div>
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Název mixu</th><th>Složení</th><th className="actions">Akce</th></tr></thead>
                            <tbody>
                               {appData.suroviny.filter(s => s.isMix).map(mix => {
                                   const mixDef = appData.mixDefinitions[mix.id];
                                   if (!mixDef) return null;
                                   const componentsString = mixDef.components.map(c => `${appData.suroviny.find(s => s.id === c.surovinaId)?.name || '?'} (${c.percentage}%)`).join(', ');
                                   return (
                                       <tr key={mix.id}>
                                           <td>{mix.name}</td>
                                           <td style={{whiteSpace: 'normal'}}>{componentsString}</td>
                                           <td className="actions">
                                               <button className="btn-icon" onClick={() => setEditingMixId(mix.id)}><IconEdit /></button>
                                               <button className="btn-icon danger" onClick={() => handleDeleteMix(mix.id)}><IconTrash /></button>
                                           </td>
                                       </tr>
                                   );
                               })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateMixView;