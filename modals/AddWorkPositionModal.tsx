import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, WorkPosition } from '../types';

const generateId = () => crypto.randomUUID();

interface AddWorkPositionModalProps {
    positionId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddWorkPositionModal: React.FC<AddWorkPositionModalProps> = ({ positionId, appData, setAppData, showToast, onClose }) => {
    const [name, setName] = useState('');
    const isEditing = Boolean(positionId);

    useEffect(() => {
        if (isEditing) {
            const position = appData.workPositions.find(p => p.id === positionId);
            if (position) setName(position.name);
        }
    }, [positionId, appData.workPositions, isEditing]);

    const handleSave = () => {
        if (!name.trim()) {
            showToast('Název umístění nesmí být prázdný.', 'error');
            return;
        }

        const normalizedName = name.trim().toLowerCase();
        const existingPosition = appData.workPositions.find(p => p.name.toLowerCase() === normalizedName);
        if (existingPosition && existingPosition.id !== positionId) {
            showToast('Pracovní umístění s tímto názvem již existuje.', 'error');
            return;
        }

        if (isEditing) {
            setAppData(prev => {
                const updatedPositions = prev.workPositions.map(p => 
                    p.id === positionId ? { ...p, name: name.trim() } : p
                );
                // Also update any person who has the old position name
                const oldPosition = prev.workPositions.find(p => p.id === positionId);
                const updatedPeople = oldPosition && oldPosition.name !== name.trim()
                    ? prev.people.map(person => person.position === oldPosition.name ? { ...person, position: name.trim() } : person)
                    : prev.people;

                return {
                    ...prev,
                    workPositions: updatedPositions,
                    people: updatedPeople
                };
            });
            showToast('Pracovní umístění upraveno');
        } else {
            const newPosition: WorkPosition = { id: generateId(), name: name.trim() };
            setAppData(prev => ({
                ...prev,
                workPositions: [...prev.workPositions, newPosition],
            }));
            showToast('Nové pracovní umístění vytvořeno');
        }
        onClose();
    };

    return (
        <Modal
            title={isEditing ? 'Upravit umístění' : 'Nové pracovní umístění'}
            onClose={onClose}
            maxWidth="500px"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave}>Uložit</button>
                </>
            }
        >
            <div className="form-group">
                <label htmlFor="positionName">Název umístění</label>
                <input
                    id="positionName"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Např. kráječ"
                    autoFocus
                />
            </div>
        </Modal>
    );
};

export default AddWorkPositionModal;
