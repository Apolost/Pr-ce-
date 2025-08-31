import React from 'react';
import Modal from '../components/Modal';
import type { AppState } from '../types';
import { IconEdit, IconTrash } from '../App';

interface DayDetailsModalProps {
    date: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
    onClose: () => void;
    getCustomerName: (id: string) => string;
    getSurovinaName: (id: string) => string;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ date, appData, setAppData, showConfirmation, setModal, onClose, getCustomerName, getSurovinaName }) => {
    
    const dayActions = appData.plannedActions.filter(a => date >= a.startDate && (!a.endDate || date <= a.endDate));
    const dayOrders = appData.orders.filter(o => o.date === date);
    
    const handleDeleteAction = (actionId: string) => {
        showConfirmation("Opravdu si přejete smazat tuto naplánovanou akci?", () => {
            setAppData(prev => ({
                ...prev,
                plannedActions: prev.plannedActions.filter(a => a.id !== actionId)
            }));
            onClose(); 
        });
    };

    return (
        <Modal
            title={`Detail dne ${new Date(date + 'T00:00:00').toLocaleDateString('cs-CZ')}`}
            onClose={onClose}
            footer={<button className="btn btn-secondary" onClick={onClose}>Zavřít</button>}
        >
            {dayActions.length > 0 && <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px'}}>Naplánované akce</h3>}
            {dayActions.map(action => (
                 <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                    <div>
                        <strong>{getSurovinaName(action.surovinaId)}</strong> pro {getCustomerName(action.customerId)} ({action.dailyCounts[date]} beden)
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => { onClose(); setModal({name: 'planAction', actionId: action.id});}}><IconEdit /></button>
                        <button className="btn-icon danger" onClick={() => handleDeleteAction(action.id)}><IconTrash /></button>
                    </div>
                </div>
            ))}
            {dayOrders.length > 0 && (
                <>
                    <h3 style={{marginTop: '24px', fontSize: '1.1rem', fontWeight: 600}}>Standardní objednávky</h3>
                    <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Upravujte v záložce Objednávky.</p>
                </>
            )}
             {dayActions.length === 0 && dayOrders.length === 0 && <p>Žádné události pro tento den.</p>}
        </Modal>
    );
};

export default DayDetailsModal;