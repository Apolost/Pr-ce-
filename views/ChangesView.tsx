import React from 'react';
import type { AppState } from '../types';
import { IconEdit, IconTrash, IconPlus } from '../App';

interface ChangesViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
}

const ChangesView: React.FC<ChangesViewProps> = ({ appData, setAppData, showConfirmation, setModal }) => {
    
    const handleDelete = (changeId: string) => {
        showConfirmation("Opravdu chcete smazat tuto změnu?", () => {
            setAppData(prev => ({
                ...prev,
                changes: prev.changes.filter(c => c.id !== changeId)
            }));
        });
    };

    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{ marginBottom: 0 }}>Změny</h1>
                <button className="btn btn-success" onClick={() => setModal({ name: 'addChange' })}><IconPlus /> Přidat změnu</button>
            </div>
            <div className="card">
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Platnost od</th>
                                    <th>Platnost do</th>
                                    <th>Nadpis</th>
                                    <th>Popis</th>
                                    <th className="actions">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appData.changes.map(change => (
                                    <tr key={change.id}>
                                        <td>{new Date(change.dateFrom).toLocaleDateString('cs-CZ')}</td>
                                        <td>{change.dateTo ? new Date(change.dateTo).toLocaleDateString('cs-CZ') : '-'}</td>
                                        <td>{change.title}</td>
                                        <td style={{whiteSpace: 'normal'}}>{change.text}</td>
                                        <td className="actions">
                                            <button className="btn-icon" onClick={() => setModal({ name: 'addChange', changeId: change.id })}><IconEdit /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(change.id)}><IconTrash /></button>
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

export default ChangesView;