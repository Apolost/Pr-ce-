import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, DocumentFolder } from '../types';

const generateId = () => crypto.randomUUID();

interface AddDocumentFolderModalProps {
    folderId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddDocumentFolderModal: React.FC<AddDocumentFolderModalProps> = ({ folderId, appData, setAppData, showToast, onClose }) => {
    const [name, setName] = useState('');
    const isEditing = Boolean(folderId);

    useEffect(() => {
        if (isEditing) {
            const folder = appData.documentFolders.find(f => f.id === folderId);
            if (folder) setName(folder.name);
        }
    }, [folderId, appData.documentFolders, isEditing]);

    const handleSave = () => {
        if (!name.trim()) {
            showToast('Název složky nesmí být prázdný.', 'error');
            return;
        }

        const normalizedName = name.trim().toLowerCase();
        const existingFolder = appData.documentFolders.find(f => f.name.toLowerCase() === normalizedName);
        if (existingFolder && existingFolder.id !== folderId) {
            showToast('Složka s tímto názvem již existuje.', 'error');
            return;
        }

        if (isEditing) {
            setAppData(prev => ({
                ...prev,
                documentFolders: prev.documentFolders.map(f => f.id === folderId ? { ...f, name: name.trim() } : f),
            }));
            showToast('Složka upravena');
        } else {
            const newFolder: DocumentFolder = { id: generateId(), name: name.trim() };
            setAppData(prev => ({
                ...prev,
                documentFolders: [...prev.documentFolders, newFolder],
            }));
            showToast('Nová složka vytvořena');
        }
        onClose();
    };

    return (
        <Modal
            title={isEditing ? 'Upravit složku' : 'Vytvořit novou složku'}
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
                <label htmlFor="folderName">Název složky</label>
                <input
                    id="folderName"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Např. Reporty"
                    autoFocus
                />
            </div>
        </Modal>
    );
};

export default AddDocumentFolderModal;
