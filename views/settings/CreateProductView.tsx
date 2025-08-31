import React, { useState, useEffect } from 'react';
import type { AppState, Product } from '../../types';
import { isKfcSurovinaByName } from '../../constants';
import { IconTrash, IconEdit } from '../../App';

const generateId = () => crypto.randomUUID();
const EMPTY_PRODUCT: Omit<Product, 'id'> = {
    name: '', customerId: '', surovinaId: '', boxWeight: 0,
    marinadeName: '', marinadePercent: 0, lossPercent: 0,
    calibratedSurovinaId: '', calibratedWeight: '', isExtra: false, isBulk: false,
};

interface CreateProductViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const CreateProductView: React.FC<CreateProductViewProps> = ({ appData, setAppData, showToast, showConfirmation }) => {
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [product, setProduct] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);

    const nonKfcSuroviny = appData.suroviny.filter(s => (s.isActive ?? true) && !isKfcSurovinaByName(s.name));

    useEffect(() => {
        const firstCustomer = appData.zakaznici[0]?.id || '';
        const firstSurovina = nonKfcSuroviny[0]?.id || '';
        const empty = {...EMPTY_PRODUCT, customerId: firstCustomer, surovinaId: firstSurovina, calibratedSurovinaId: firstSurovina };

        if (!editingProductId) {
            setProduct(empty);
        } else {
            const existingProduct = appData.products.find(p => p.id === editingProductId);
            setProduct(existingProduct || empty);
        }
    }, [editingProductId, appData]);

    const handleChange = (field: keyof Omit<Product, 'id'>, value: string | number | boolean) => {
        setProduct(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        if (!product.name.trim() || !product.customerId || !product.surovinaId) {
            showToast('Název, zákazník a surovina jsou povinné.', 'error');
            return;
        }

        if (editingProductId) {
            setAppData(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === editingProductId ? { ...p, ...product } : p)
            }));
            showToast('Produkt upraven');
        } else {
            setAppData(prev => ({
                ...prev,
                products: [...prev.products, { ...product, id: generateId() }]
            }));
            showToast('Nový produkt uložen');
        }
        setEditingProductId(null);
    };

    const handleDelete = (productId: string) => {
        showConfirmation("Opravdu chcete smazat tento produkt?", () => {
             setAppData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== productId) }));
             showToast('Produkt smazán');
        });
    };
    
    const cancelEdit = () => setEditingProductId(null);

    return (
        <div>
            <h1 className="page-header">{editingProductId ? 'Upravit produkt' : 'Vytvořit nový produkt'}</h1>
            <div className="card">
                <div className="card-content">
                     <div className="form-row">
                        <div className="form-field"><label>Název produktu</label><input type="text" value={product.name} onChange={e => handleChange('name', e.target.value)} /></div>
                        <div className="form-field"><label>Zákazník</label><select value={product.customerId} onChange={e => handleChange('customerId', e.target.value)}>{appData.zakaznici.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    </div>
                    <div className="form-row" style={{marginTop: '20px'}}>
                        <div className="form-field"><label>Surovina</label><select value={product.surovinaId} onChange={e => handleChange('surovinaId', e.target.value)}>{nonKfcSuroviny.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div className="form-field"><label>Váha bedny (g)</label><input type="number" value={product.boxWeight} onChange={e => handleChange('boxWeight', parseFloat(e.target.value))} /></div>
                    </div>
                    <div className="form-row" style={{marginTop: '20px'}}>
                        <div className="form-field"><label>Název marinády (nepovinné)</label><input type="text" value={product.marinadeName} onChange={e => handleChange('marinadeName', e.target.value)} /></div>
                        <div className="form-field"><label>Marináda % (nepovinné)</label><input type="number" value={product.marinadePercent} onChange={e => handleChange('marinadePercent', parseFloat(e.target.value))} /></div>
                        <div className="form-field"><label>Ztráta % (nepovinné)</label><input type="number" value={product.lossPercent} onChange={e => handleChange('lossPercent', parseFloat(e.target.value))} /></div>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />
                    <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px'}}>Kalibrace</h3>
                     <div className="form-row">
                        <div className="form-field"><label>Kalibrovaná surovina</label><select value={product.calibratedSurovinaId} onChange={e => handleChange('calibratedSurovinaId', e.target.value)}>{nonKfcSuroviny.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div className="form-field"><label>Váha (g) od-do</label><input type="text" value={product.calibratedWeight} onChange={e => handleChange('calibratedWeight', e.target.value)} placeholder="např. 80-100" /></div>
                    </div>
                    <div className="form-group" style={{marginTop: '20px'}}>
                        <div style={{display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                                <input 
                                    type="checkbox" 
                                    checked={!!product.isExtra} 
                                    onChange={e => handleChange('isExtra', e.target.checked)}
                                    style={{width: 'auto', height: '16px', margin: 0}}
                                />
                                <span>Přidat do sekce Extra</span>
                            </label>
                             <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                                <input 
                                    type="checkbox" 
                                    checked={!!product.isBulk} 
                                    onChange={e => handleChange('isBulk', e.target.checked)}
                                    style={{width: 'auto', height: '16px', margin: 0}}
                                />
                                <span>Přidat do sekce Volně</span>
                            </label>
                        </div>
                        <small style={{display: 'block', marginTop: '8px', color: 'var(--text-secondary)'}}>Zaškrtnutím "Extra" se produkt zobrazí v cílech výroby na hlavní stránce.</small>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {editingProductId && <button className="btn btn-secondary" onClick={cancelEdit}>Zrušit úpravu</button>}
                        <button className="btn btn-primary" onClick={handleSave}>Uložit produkt</button>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-header"><h2 className="card-title">Existující produkty</h2></div>
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Název</th><th>Zákazník</th><th>Surovina</th><th>Váha bedny (g)</th><th>Extra</th><th>Volně</th><th className="actions">Akce</th></tr></thead>
                            <tbody>
                                {appData.products.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{appData.zakaznici.find(c => c.id === p.customerId)?.name || 'N/A'}</td>
                                        <td>{appData.suroviny.find(s => s.id === p.surovinaId)?.name || 'N/A'}</td>
                                        <td>{p.boxWeight}</td>
                                        <td>{p.isExtra ? 'Ano' : 'Ne'}</td>
                                        <td>{p.isBulk ? 'Ano' : 'Ne'}</td>
                                        <td className="actions">
                                            <button className="btn-icon" onClick={() => setEditingProductId(p.id)}><IconEdit /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(p.id)}><IconTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProductView;