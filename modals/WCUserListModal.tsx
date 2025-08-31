import React from 'react';
import Modal from '../components/Modal';
import type { AppState, WheelchairUser } from '../types';
import { IconEdit, IconTrash } from '../App';

interface WCUserListModalProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    setModal: (modal: any) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    onClose: () => void;
}

const WCUserListModal: React.FC<WCUserListModalProps> = ({ appData, setAppData, setModal, showConfirmation, onClose }) => {

    const handleDelete = (userId: string) => {
        showConfirmation('Opravdu chcete smazat tohoto vozíčkáře ze systému?', () => {
            setAppData(prev => {
                const newSchedule = JSON.parse(JSON.stringify(prev.wheelchairSchedule));
                Object.keys(newSchedule).forEach(weekKey => {
                    Object.keys(newSchedule[weekKey]).forEach(dateKey => {
                        Object.keys(newSchedule[weekKey][dateKey]).forEach(shiftKey => {
                            newSchedule[weekKey][dateKey][shiftKey] = newSchedule[weekKey][dateKey][shiftKey].filter((id: string) => id !== userId);
                        });
                    });
                });
                return {
                    ...prev,
                    wheelchairUsers: prev.wheelchairUsers.filter(u => u.id !== userId),
                    wheelchairSchedule: newSchedule
                };
            });
        });
    };

    return (
        <Modal
            title="Seznam vozíčkářů"
            onClose={onClose}
            footer={<button className="btn btn-secondary" onClick={onClose}>Zavřít</button>}
        >
            <div className="table-responsive-wrapper">
                <table className="data-table">
                    <thead><tr><th>Jméno</th><th>Čip</th><th className="actions">Akce</th></tr></thead>
                    <tbody>
                        {appData.wheelchairUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.chip}</td>
                                <td className="actions">
                                    <button className="btn-icon" onClick={() => setModal({name: 'wcUser', userId: user.id})}><IconEdit /></button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(user.id)}><IconTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

export default WCUserListModal;