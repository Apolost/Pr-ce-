import React from 'react';
import Modal from './Modal';

interface ConfirmationDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ message, onConfirm, onCancel }) => {
    
    const handleConfirm = () => {
        onConfirm();
        onCancel(); 
    };

    return (
        <Modal
            title="Potvrdit akci"
            onClose={onCancel}
            maxWidth="450px"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onCancel}>Zrušit</button>
                    <button className="btn btn-danger" onClick={handleConfirm}>Potvrdit</button>
                </>
            }
        >
            <p>{message}</p>
        </Modal>
    );
};

export default ConfirmationDialog;
