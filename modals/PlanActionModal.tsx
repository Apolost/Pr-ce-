import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, PlannedAction } from '../types';

const generateId = () => crypto.randomUUID();

interface PlanActionModalProps {
    actionId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const PlanActionModal: React.FC<PlanActionModalProps> = ({ actionId, appData, setAppData, showToast, onClose }) => {
    const [action, setAction] = useState<Omit<PlannedAction, 'id'>>({
        customerId: appData.zakaznici[0]?.id || '',
        surovinaId: appData.suroviny[0]?.id || '',
        startDate: '',
        endDate: '',
        dailyCounts: {}
    });

    useEffect(() => {
        if (actionId) {
            const existingAction = appData.plannedActions.find(a => a.id === actionId);
            if (existingAction) setAction(existingAction);
        }
    }, [actionId, appData.plannedActions]);

    const handleChange = (field: keyof Omit<PlannedAction, 'id'>, value: any) => {
        setAction(prev => ({ ...prev, [field]: value }));
    };
    
    const handleDailyCountChange = (date: string, count: number) => {
        setAction(prev => ({
            ...prev,
            dailyCounts: { ...prev.dailyCounts, [date]: count }
        }));
    };

    const handleSave = () => {
        if (!action.startDate) {
            showToast('Datum "Od" je povinné.', 'error');
            return;
        }

        setAppData(prev => {
            if (actionId) {
                return { ...prev, plannedActions: prev.plannedActions.map(a => a.id === actionId ? { ...action, id: actionId } : a) };
            }
            return { ...prev, plannedActions: [...prev.plannedActions, { ...action, id: generateId() }] };
        });
        
        showToast(actionId ? 'Akce upravena' : 'Akce naplánována');
        onClose();
    };

    const renderDailyCounts = () => {
        if (!action.startDate) return null;

        // FIX: Correctly parse dates in local timezone to avoid off-by-one errors and prevent infinite loops.
        // The `+ 'T00:00:00'` ensures the date is interpreted in the user's local timezone.
        const start = new Date(action.startDate + 'T00:00:00');
        
        // Ensure 'end' is a new Date object to prevent side effects.
        const end = action.endDate ? new Date(action.endDate + 'T00:00:00') : new Date(start);

        // Return null if dates are invalid or end is before start.
        if (isNaN(start.getTime()) || end < start) {
            return null;
        }

        const days = [];
        const currentDate = new Date(start);
        let safetyCounter = 0; // Safety break to prevent potential infinite loops.
        
        while (currentDate <= end && safetyCounter < 366) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
            safetyCounter++;
        }

        return days.map(day => {
            const dateStr = day.toISOString().split('T')[0];
            const dayLabel = day.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
            return (
                 <div className="form-row" key={dateStr}>
                    <label style={{ flexBasis: '150px' }}>{dayLabel}</label>
                    <div className="form-field">
                        <input type="number" value={action.dailyCounts[dateStr] || 0} onChange={e => handleDailyCountChange(dateStr, parseInt(e.target.value) || 0)} min="0" />
                    </div>
                </div>
            );
        });
    };

    return (
        <Modal
            title={actionId ? 'Upravit akci' : 'Naplánovat akci'}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit akci</button></>}
        >
             <div className="form-row">
                <div className="form-field"><label>Zákazník</label><select value={action.customerId} onChange={e => handleChange('customerId', e.target.value)}>{appData.zakaznici.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="form-field"><label>Produkt</label><select value={action.surovinaId} onChange={e => handleChange('surovinaId', e.target.value)}>{appData.suroviny.filter(s => (s.isActive ?? true)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div className="form-row">
                <div className="form-field"><label>Od</label><input type="date" value={action.startDate} onChange={e => handleChange('startDate', e.target.value)} /></div>
                <div className="form-field"><label>Do (nepovinné)</label><input type="date" value={action.endDate} onChange={e => handleChange('endDate', e.target.value)} /></div>
            </div>
            {renderDailyCounts()}
        </Modal>
    );
};

export default PlanActionModal;