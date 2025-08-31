import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onEnd: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onEnd }) => {
    useEffect(() => {
        const timer = setTimeout(onEnd, 3000);
        return () => clearTimeout(timer);
    }, [onEnd]);

    return (
        <div id="toast-container">
            <div className={`toast ${type}`}>
                {message}
            </div>
        </div>
    );
};

export default Toast;
