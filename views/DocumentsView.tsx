import React, { useState, useMemo } from 'react';
import type { AppState } from '../types';
import { IconEdit, IconTrash } from '../App';

interface DocumentsViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ appData, setAppData, showToast, showConfirmation, setModal }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFolders = useMemo(() => {
        if (!searchTerm.trim()) {
            return appData.documentFolders;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        const folderIdsWithMatches = new Set(
            appData.documentFiles
                .filter(file => file.name.toLowerCase().includes(lowercasedFilter))
                .map(file => file.folderId)
        );
        return appData.documentFolders.filter(folder => folderIdsWithMatches.has(folder.id) || folder.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, appData.documentFolders, appData.documentFiles]);

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path).then(() => {
            showToast('Cesta zkopírována do schránky');
        }).catch(err => {
            showToast('Nepodařilo se zkopírovat cestu', 'error');
            console.error('Copy failed', err);
        });
    };

    const handleDeleteFile = (fileId: string) => {
        showConfirmation("Opravdu chcete smazat tento odkaz na soubor? Soubor v PC zůstane nedotčen.", () => {
            setAppData(prev => ({
                ...prev,
                documentFiles: prev.documentFiles.filter(f => f.id !== fileId)
            }));
            showToast('Odkaz na soubor smazán.');
        });
    };

    const handleDeleteFolder = (folderId: string) => {
        showConfirmation("Opravdu chcete smazat tuto složku a všechny její odkazy na soubory?", () => {
            setAppData(prev => ({
                ...prev,
                documentFolders: prev.documentFolders.filter(f => f.id !== folderId),
                documentFiles: prev.documentFiles.filter(f => f.folderId !== folderId)
            }));
            showToast('Složka smazána.');
        });
    };

    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{ marginBottom: 0 }}>Dokumenty</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        type="search"
                        placeholder="Hledat dokument..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ minWidth: '200px' }}
                    />
                    <button className="btn btn-secondary" onClick={() => setModal({ name: 'addDocumentFolder' })}>
                        + Nová složka
                    </button>
                    <button className="btn btn-primary" onClick={() => setModal({ name: 'addDocumentFile' })}>
                        + Přidat soubor
                    </button>
                </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {filteredFolders.map(folder => {
                    const filesInFolder = appData.documentFiles.filter(file => 
                        file.folderId === folder.id &&
                        (file.name.toLowerCase().includes(searchTerm.toLowerCase()) || (file.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    return (
                        <details key={folder.id} className="accordion-item" open={!!searchTerm.trim()}>
                            <summary>
                                <span className="summary-title">{folder.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="item-count-badge">{filesInFolder.length} souborů</span>
                                    <button className="btn-icon" onClick={(e) => { e.preventDefault(); setModal({ name: 'addDocumentFolder', folderId: folder.id }); }}><IconEdit /></button>
                                    <button className="btn-icon danger" onClick={(e) => { e.preventDefault(); handleDeleteFolder(folder.id); }}><IconTrash /></button>
                                </div>
                                 <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </summary>
                            <div className="accordion-content">
                                {filesInFolder.length > 0 ? (
                                    <div className="table-responsive-wrapper">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Název dokumentu</th>
                                                    <th style={{ whiteSpace: 'normal'}}>Soubor / Cesta</th>
                                                    <th className="actions">Akce</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filesInFolder.map(file => {
                                                    const isDataUrl = file.path && file.path.startsWith('data:');
                                                    return (
                                                        <tr key={file.id}>
                                                            <td>{file.name}</td>
                                                            <td>
                                                                {isDataUrl ? (
                                                                    <a href={file.path} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                                                                        {file.fileName || 'Otevřít soubor'}
                                                                    </a>
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a href={file.path} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                                                                            Otevřít cestu
                                                                        </a>
                                                                        <button className="btn-icon" title="Kopírovat cestu" onClick={() => handleCopyPath(file.path)}>
                                                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="actions">
                                                                <button className="btn-icon" onClick={() => setModal({ name: 'addDocumentFile', fileId: file.id })}><IconEdit /></button>
                                                                <button className="btn-icon danger" onClick={() => handleDeleteFile(file.id)}><IconTrash /></button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>V této složce nejsou žádné soubory.</p>
                                )}
                            </div>
                        </details>
                    )
                })}
            </div>
        </div>
    );
};

export default DocumentsView;