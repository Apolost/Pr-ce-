import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, DocumentFile } from '../types';

const generateId = () => crypto.randomUUID();

interface AddDocumentFileModalProps {
    fileId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const EMPTY_FILE: Omit<DocumentFile, 'id'> = {
    name: '',
    path: '',
    fileName: '',
    folderId: ''
};

const AddDocumentFileModal: React.FC<AddDocumentFileModalProps> = ({ fileId, appData, setAppData, showToast, onClose }) => {
    const [file, setFile] = useState<Omit<DocumentFile, 'id'>>(EMPTY_FILE);
    const [selectedFileName, setSelectedFileName] = useState<string>('');


    const isEditing = Boolean(fileId);

    useEffect(() => {
        const firstFolderId = appData.documentFolders[0]?.id || '';
        if (isEditing) {
            const existingFile = appData.documentFiles.find(f => f.id === fileId);
            if (existingFile) {
                setFile(existingFile);
                if (existingFile.fileName) {
                    setSelectedFileName(existingFile.fileName);
                }
            }
        } else {
            setFile({ ...EMPTY_FILE, folderId: firstFolderId });
        }
    }, [fileId, appData.documentFiles, appData.documentFolders, isEditing]);

    const handleChange = (field: keyof Omit<DocumentFile, 'id'>, value: string) => {
        setFile(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setSelectedFileName(selectedFile.name);
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setFile(prev => ({
                    ...prev,
                    path: dataUrl,
                    fileName: selectedFile.name,
                    // If name is empty, pre-fill it with file name without extension
                    name: prev.name || selectedFile.name.replace(/\.[^/.]+$/, "")
                }));
            };
            reader.onerror = () => {
                showToast('Chyba při načítání souboru.', 'error');
                setSelectedFileName('');
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSave = () => {
        if (!file.name.trim() || !file.folderId) {
            showToast('Název dokumentu a složka jsou povinné.', 'error');
            return;
        }
        if (!file.path) {
            showToast('Prosím, nahrajte soubor.', 'error');
            return;
        }

        if (isEditing) {
            setAppData(prev => ({
                ...prev,
                documentFiles: prev.documentFiles.map(f => f.id === fileId ? { ...file, id: fileId } : f),
            }));
            showToast('Odkaz na soubor upraven');
        } else {
            setAppData(prev => ({
                ...prev,
                documentFiles: [...prev.documentFiles, { ...file, id: generateId() }],
            }));
            showToast('Nový odkaz na soubor přidán');
        }
        onClose();
    };

    return (
        <Modal
            title={isEditing ? 'Upravit odkaz na soubor' : 'Přidat odkaz na soubor'}
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave}>Uložit</button>
                </>
            }
        >
            <div className="form-group">
                <label htmlFor="fileName">Pojmenování souboru</label>
                <input
                    id="fileName"
                    type="text"
                    value={file.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="Např. Týdenní report prodeje"
                    autoFocus
                />
            </div>
            <div className="form-group">
                <label htmlFor="fileUpload">Soubor</label>
                <input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileChange}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--dz-border-color)',
                        backgroundColor: 'var(--dz-bg-secondary)',
                        color: 'var(--dz-text-primary)',
                        borderRadius: 'var(--dz-border-radius-md)',
                        fontSize: '0.95rem',
                        fontFamily: 'var(--dz-font-family)'
                    }}
                />
                {selectedFileName && (
                     <p style={{ marginTop: '8px', color: 'var(--dz-text-secondary)', fontSize: '0.9rem' }}>
                        Vybráno: <strong>{selectedFileName}</strong>
                    </p>
                )}
            </div>
            <div className="form-group">
                <label htmlFor="fileFolder">Složka</label>
                <select 
                    id="fileFolder" 
                    value={file.folderId} 
                    onChange={e => handleChange('folderId', e.target.value)}
                    disabled={appData.documentFolders.length === 0}
                >
                    {appData.documentFolders.length === 0 ? (
                        <option>Nejprve vytvořte složku</option>
                    ) : (
                        appData.documentFolders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))
                    )}
                </select>
            </div>
        </Modal>
    );
};

export default AddDocumentFileModal;