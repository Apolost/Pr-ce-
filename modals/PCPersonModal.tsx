import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, PCPerson } from '../types';

const generateId = () => crypto.randomUUID();

const EMPTY_PERSON: Omit<PCPerson, 'id'> = {
    firstName: '', lastName: '', chip: '', phone: '', shift: '1', gender: 'muz', position: ''
};

interface PCPersonModalProps {
    personId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const PCPersonModal: React.FC<PCPersonModalProps> = ({ personId, appData, setAppData, showToast, onClose }) => {
    const [person, setPerson] = useState(() => {
        const defaultPosition = appData.workPositions[0]?.name || '';
        return { ...EMPTY_PERSON, position: defaultPosition };
    });

    useEffect(() => {
        if (personId) {
            const existing = appData.people.find(p => p.id === personId);
            if (existing) setPerson(existing);
        } else {
            const defaultPosition = appData.workPositions[0]?.name || '';
            setPerson({ ...EMPTY_PERSON, position: defaultPosition });
        }
    }, [personId, appData.people, appData.workPositions]);

    const handleChange = (field: keyof Omit<PCPerson, 'id'>, value: string) => {
        setPerson(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!person.firstName.trim() || !person.lastName.trim() || !person.chip.trim()) {
            showToast('Jméno, příjmení a čip jsou povinné.', 'error');
            return;
        }

        if (personId) {
            setAppData(prev => ({ ...prev, people: prev.people.map(p => p.id === personId ? { ...person, id: personId } : p) }));
            showToast('Osoba upravena');
        } else {
            setAppData(prev => ({ ...prev, people: [...prev.people, { ...person, id: generateId() }] }));
            showToast('Osoba přidána');
        }
        onClose();
    };

    return (
        <Modal
            title={personId ? 'Upravit osobu' : 'Přidat osobu'}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit</button></>}
        >
             <div className="form-row">
                <div className="form-field"><label>Jméno</label><input type="text" value={person.firstName} onChange={e => handleChange('firstName', e.target.value)} /></div>
                <div className="form-field"><label>Příjmení</label><input type="text" value={person.lastName} onChange={e => handleChange('lastName', e.target.value)} /></div>
            </div>
            <div className="form-row">
                <div className="form-field"><label>Čip</label><input type="text" value={person.chip} onChange={e => handleChange('chip', e.target.value)} /></div>
                <div className="form-field"><label>Telefon (nepovinné)</label><input type="tel" value={person.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
            </div>
            <div className="form-row">
                <div className="form-field"><label>Směna</label><select value={person.shift} onChange={e => handleChange('shift', e.target.value)}><option value="1">1. směna</option><option value="2">2. směna</option></select></div>
                <div className="form-field"><label>Pohlaví</label><select value={person.gender} onChange={e => handleChange('gender', e.target.value)}><option value="muz">Muž</option><option value="zena">Žena</option></select></div>
            </div>
            <div className="form-group">
                <label>Pracovní místo</label>
                <select value={person.position} onChange={e => handleChange('position', e.target.value)}>
                    {appData.workPositions.map(p => <option key={p.id} value={p.name}>{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</option>)}
                </select>
            </div>
        </Modal>
    );
};

export default PCPersonModal;
