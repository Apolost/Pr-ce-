import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, PCEvent } from '../types';

const generateId = () => crypto.randomUUID();

interface PCEventModalProps {
    eventId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const EMPTY_EVENT: Omit<PCEvent, 'id'> = {
    chip: '', type: 'vacation', dateFrom: new Date().toISOString().split('T')[0], dateTo: ''
};

const PCEventModal: React.FC<PCEventModalProps> = ({ eventId, appData, setAppData, showToast, onClose }) => {
    const [event, setEvent] = useState(EMPTY_EVENT);

    useEffect(() => {
        if (eventId) {
            const existing = appData.peopleEvents.find(e => e.id === eventId);
            if (existing) setEvent(existing);
        } else {
            setEvent(EMPTY_EVENT);
        }
    }, [eventId, appData.peopleEvents]);

    const handleChange = (field: keyof Omit<PCEvent, 'id'>, value: string) => {
        setEvent(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!event.chip.trim()) {
            showToast('Musíte vybrat zaměstnance.', 'error');
            return;
        }
        if (!appData.people.some(p => p.chip === event.chip)) {
            showToast('Zaměstnanec s tímto čipem neexistuje.', 'error');
            return;
        }

        if (eventId) {
            setAppData(prev => ({ ...prev, peopleEvents: prev.peopleEvents.map(e => e.id === eventId ? { ...event, id: eventId } : e) }));
            showToast('Událost upravena');
        } else {
            setAppData(prev => ({ ...prev, peopleEvents: [...prev.peopleEvents, { ...event, id: generateId() }] }));
            showToast('Událost přidána');
        }
        onClose();
    };

    return (
        <Modal
            title={eventId ? 'Upravit událost' : 'Přidat událost'}
            onClose={onClose}
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit událost</button></>}
        >
             <div className="form-group">
                <label>Čip zaměstnance</label>
                <input type="text" value={event.chip} onChange={e => handleChange('chip', e.target.value)} list="pc-employee-chips" placeholder="Začněte psát čip nebo jméno..." />
                <datalist id="pc-employee-chips">
                    {appData.people.map(p => <option key={p.id} value={p.chip}>{p.firstName} {p.lastName}</option>)}
                </datalist>
            </div>
            <div className="form-group">
                <label>Typ události</label>
                <select value={event.type} onChange={e => handleChange('type', e.target.value)}>
                    <option value="vacation">Dovolená</option>
                    <option value="sickness">Nemoc</option>
                    <option value="departure">Odjezd</option>
                    <option value="other">Další</option>
                </select>
            </div>
            <div className="form-row">
                <div className="form-field">
                    <label>Datum od</label>
                    <input type="date" value={event.dateFrom} onChange={e => handleChange('dateFrom', e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Datum do (nepovinné)</label>
                    <input type="date" value={event.dateTo} onChange={e => handleChange('dateTo', e.target.value)} />
                </div>
            </div>
        </Modal>
    );
};

export default PCEventModal;
