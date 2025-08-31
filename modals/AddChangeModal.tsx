import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, Change } from '../types';

const generateId = () => crypto.randomUUID();

interface AddChangeModalProps {
    changeId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddChangeModal: React.FC<AddChangeModalProps> = ({ changeId, appData, setAppData, showToast, onClose }) => {
    const [change, setChange] = useState<Omit<Change, 'id'>>({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: '',
        title: '',
        text: ''
    });

    useEffect(() => {
        if (changeId) {
            const existing = appData.changes.find(c => c.id === changeId);
            if (existing) setChange(existing);
        }
    }, [changeId, appData.changes]);

    const handleChange = (field: keyof Omit<Change, 'id'>, value: string) => {
        setChange(prev => ({...prev, [field]: value}));
    };
    
    const handleSave = () => {
        if (!change.title.trim() || !change.dateFrom) {
            showToast('Datum "od" a nadpis jsou povinné.', 'error');
            return;
        }

        if (changeId) {
            setAppData(prev => ({ ...prev, changes: prev.changes.map(c => c.id === changeId ? { ...change, id: changeId } : c) }));
            showToast('Změna upravena');
        } else {
            setAppData(prev => ({ ...prev, changes: [...prev.changes, { ...change, id: generateId() }] }));
            showToast('Změna uložena');
        }
        onClose();
    };

    return (
        <Modal
            title={changeId ? 'Upravit změnu' : 'Přidat změnu'}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit změnu</button></>}
        >
             <div className="form-row">
                <div className="form-field">
                    <label>Platnost od</label>
                    <input type="date" value={change.dateFrom} onChange={e => handleChange('dateFrom', e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Platnost do (nepovinné)</label>
                    <input type="date" value={change.dateTo} onChange={e => handleChange('dateTo', e.target.value)} />
                </div>
            </div>
            <div className="form-group">
                <label>Nadpis</label>
                <input type="text" value={change.title} onChange={e => handleChange('title', e.target.value)} placeholder="Stručný popis změny" />
            </div>
            <div className="form-group">
                <label>Text změny</label>
                <textarea value={change.text} onChange={e => handleChange('text', e.target.value)} placeholder="Detailní popis změny..."></textarea>
            </div>
        </Modal>
    );
};

export default AddChangeModal;
