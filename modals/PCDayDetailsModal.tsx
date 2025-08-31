import React from 'react';
import Modal from '../components/Modal';
import type { AppState } from '../types';
import { IconEdit, IconTrash } from '../App';

interface PCDayDetailsModalProps {
    date: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
    onClose: () => void;
}

const PCDayDetailsModal: React.FC<PCDayDetailsModalProps> = ({ date, appData, setAppData, showConfirmation, setModal, onClose }) => {
    
    const dayEvents = appData.peopleEvents.filter(e => {
        const eventStart = new Date(e.dateFrom + 'T00:00:00');
        const eventEnd = e.dateTo ? new Date(e.dateTo + 'T00:00:00') : eventStart;
        const currentDay = new Date(date + 'T00:00:00');
        return currentDay >= eventStart && currentDay <= eventEnd;
    });

    const handleDelete = (eventId: string) => {
        showConfirmation("Opravdu chcete smazat tuto událost?", () => {
            setAppData(prev => ({ ...prev, peopleEvents: prev.peopleEvents.filter(e => e.id !== eventId) }));
            onClose();
        });
    };

    return (
        <Modal
            title={`Události ${new Date(date + 'T00:00:00').toLocaleDateString('cs-CZ')}`}
            onClose={onClose}
            footer={<button className="btn btn-secondary" onClick={onClose}>Zavřít</button>}
        >
            {dayEvents.length > 0 ? dayEvents.map(event => {
                const person = appData.people.find(p => p.chip === event.chip);
                return (
                     <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                        <div>
                            <strong>{person ? `${person.firstName} ${person.lastName}` : event.chip}</strong> - {event.type}
                        </div>
                        <div style={{ float: 'right' }}>
                            <button className="btn-icon" onClick={() => { onClose(); setModal({name: 'pcEvent', eventId: event.id}); }}><IconEdit /></button>
                            <button className="btn-icon danger" onClick={() => handleDelete(event.id)}><IconTrash /></button>
                        </div>
                    </div>
                );
            }) : <p>Pro tento den nejsou žádné události.</p>}
        </Modal>
    );
};

export default PCDayDetailsModal;