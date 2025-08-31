import React from 'react';
import type { AppState } from '../../types';
import { IconEdit, IconTrash, IconPlus } from '../../App';

interface WorkPlacementsViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
}

const WorkPlacementsView: React.FC<WorkPlacementsViewProps> = ({ appData, setAppData, showToast, showConfirmation, setModal }) => {

    const handleDelete = (positionId: string) => {
        const position = appData.workPositions.find(p => p.id === positionId);
        if (!position) return;

        const isUsed = appData.people.some(person => person.position === position.name);
        if (isUsed) {
            showToast('Nelze smazat pracovní umístění, které je přiřazeno zaměstnanci.', 'error');
            return;
        }

        showConfirmation(`Opravdu chcete smazat pracovní umístění "${position.name}"?`, () => {
            setAppData(prev => ({
                ...prev,
                workPositions: prev.workPositions.filter(p => p.id !== positionId)
            }));
            showToast('Pracovní umístění smazáno.');
        });
    };

    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{ marginBottom: 0 }}>Pracovní umístění</h1>
                <button className="btn btn-success" onClick={() => setModal({ name: 'addWorkPosition' })}>
                    <IconPlus /> Přidat umístění
                </button>
            </div>
            <div className="card">
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Název umístění</th>
                                    <th className="actions">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appData.workPositions.map(position => (
                                    <tr key={position.id}>
                                        <td>{position.name}</td>
                                        <td className="actions">
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => setModal({ name: 'addWorkPosition', positionId: position.id })}
                                                aria-label={`Upravit ${position.name}`}
                                            >
                                                <IconEdit />
                                            </button>
                                            <button 
                                                className="btn-icon danger" 
                                                onClick={() => handleDelete(position.id)} 
                                                aria-label={`Smazat ${position.name}`}
                                            >
                                                <IconTrash />
                                            </button>
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

export default WorkPlacementsView;
