import React, { useEffect } from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer: React.ReactNode;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer, maxWidth = '650px' }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal active" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="btn-icon" onClick={onClose} aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                <div className="modal-footer">{footer}</div>
            </div>
        </div>
    );
};

export default Modal;