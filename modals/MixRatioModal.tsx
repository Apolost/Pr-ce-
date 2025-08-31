import React, { useState, useMemo } from 'react';
import Modal from '../components/Modal';
import type { AppState, OrderItem } from '../types';

interface MixRatioModalProps {
    orderId: string;
    itemId: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
    getSurovinaName: (id: string) => string;
}

const MixRatioModal: React.FC<MixRatioModalProps> = ({ orderId, itemId, appData, setAppData, showToast, onClose, getSurovinaName }) => {
    const { order, item, surovina } = useMemo(() => {
        const order = appData.orders.find(o => o.id === orderId);
        const item = order?.items.find(i => i.id === itemId);
        const surovina = item ? appData.suroviny.find(s => s.id === item.surovinaId) : null;
        return { order, item, surovina };
    }, [orderId, itemId, appData]);

    const initialRatios = item?.ratioOverride || appData.mixDefinitions[item?.surovinaId || '']?.components || [];
    const [ratios, setRatios] = useState(initialRatios);

    const handleRatioChange = (surovinaId: string, percentage: number) => {
        setRatios(ratios.map(r => r.surovinaId === surovinaId ? { ...r, percentage } : r));
    };

    const total = ratios.reduce((sum, r) => sum + r.percentage, 0);

    const handleSave = () => {
        if (Math.abs(total - 100) > 0.1) {
            showToast('Součet musí být 100%', 'error');
            return;
        }
        setAppData(prev => ({
            ...prev,
            orders: prev.orders.map(o => o.id === orderId ? {
                ...o,
                items: o.items.map(i => i.id === itemId ? { ...i, ratioOverride: ratios } : i)
            } : o)
        }));
        showToast('Poměr pro objednávku upraven');
        onClose();
    };

    if (!item || !surovina) return null;

    return (
        <Modal
            title={`Upravit poměr pro: ${surovina.name}`}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit poměr</button></>}
        >
            {ratios.map(comp => (
                <div className="form-row" key={comp.surovinaId}>
                    <div className="form-field" style={{flex: 3}}><label>{getSurovinaName(comp.surovinaId)}</label></div>
                    <div className="form-field"><input type="number" value={comp.percentage} onChange={e => handleRatioChange(comp.surovinaId, parseFloat(e.target.value) || 0)} /></div>
                </div>
            ))}
             <div style={{ fontWeight: 'bold', marginTop: '15px' }}>
                Celkem: <span style={{ color: Math.abs(total - 100) > 0.1 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{total.toFixed(1)}</span>%
            </div>
        </Modal>
    );
};

export default MixRatioModal;
