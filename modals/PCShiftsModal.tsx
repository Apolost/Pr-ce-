import React from 'react';
import Modal from '../components/Modal';
import type { AppState } from '../types';
import { IconEdit, IconTrash } from '../App';

interface PCShiftsModalProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    setModal: (modal: any) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    onClose: () => void;
}

const PCShiftsModal: React.FC<PCShiftsModalProps> = ({ appData, setAppData, setModal, showConfirmation, onClose }) => {
    
    const handleDelete = (personId: string) => {
        showConfirmation("Opravdu chcete smazat tuto osobu?", () => {
            setAppData(prev => ({ ...prev, people: prev.people.filter(p => p.id !== personId) }));
        });
    };

    const shift1 = appData.people.filter(p => p.shift === '1');
    const shift2 = appData.people.filter(p => p.shift === '2');

    const PersonItem: React.FC<{person: AppState['people'][0]}> = ({ person }) => (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '8px'}}>
            <div>
                <strong style={{fontSize: '0.9rem'}}>{person.firstName} {person.lastName}</strong>
                <small style={{display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Čip: {person.chip} | {person.position}</small>
            </div>
            <div>
                <button className="btn-icon" onClick={() => setModal({name: 'pcPerson', personId: person.id})}><IconEdit /></button>
                <button className="btn-icon danger" onClick={() => handleDelete(person.id)}><IconTrash /></button>
            </div>
        </div>
    );

    return (
        <Modal
            title="Seznam směn"
            onClose={onClose}
            maxWidth="800px"
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <strong>Celkem zaměstnanců: {appData.people.length}</strong>
                    <div>
                        <button className="btn btn-primary" onClick={onClose} style={{marginLeft: '10px'}}>Zavřít</button>
                    </div>
                </div>
            }
        >
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                <div>
                    <h3 style={{marginBottom: '16px'}}>1. směna ({shift1.length})</h3>
                    {shift1.map(p => <PersonItem key={p.id} person={p} />)}
                </div>
                <div>
                    <h3 style={{marginBottom: '16px'}}>2. směna ({shift2.length})</h3>
                     {shift2.map(p => <PersonItem key={p.id} person={p} />)}
                </div>
            </div>
        </Modal>
    );
};

export default PCShiftsModal;
