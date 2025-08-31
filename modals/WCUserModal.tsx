import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, WheelchairUser } from '../types';

const generateId = () => crypto.randomUUID();

interface WCUserModalProps {
    userId?: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const EMPTY_USER: Omit<WheelchairUser, 'id'> = {
    firstName: '', lastName: '', chip: '', phone: '', startShift: 'morning'
};

const WCUserModal: React.FC<WCUserModalProps> = ({ userId, appData, setAppData, showToast, onClose }) => {
    const [user, setUser] = useState(EMPTY_USER);

    useEffect(() => {
        if (userId) {
            const existing = appData.wheelchairUsers.find(u => u.id === userId);
            if (existing) setUser(existing);
        } else {
            setUser(EMPTY_USER);
        }
    }, [userId, appData.wheelchairUsers]);

    const handleChange = (field: keyof Omit<WheelchairUser, 'id'>, value: string) => {
        setUser(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
         if (!user.firstName.trim() || !user.lastName.trim() || !user.chip.trim()) {
            showToast('Jméno, příjmení a čip jsou povinné.', 'error');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        
        const invalidateFutureSchedule = (schedule: AppState['wheelchairSchedule']) => {
            const newSchedule = { ...schedule };
             Object.keys(newSchedule).forEach(weekKey => {
                 const datesInWeek = Object.keys(newSchedule[weekKey]);
                 if (datesInWeek.length > 0) {
                     const lastDateInWeek = datesInWeek.sort().pop();
                     if (lastDateInWeek && lastDateInWeek >= todayStr) {
                         delete newSchedule[weekKey];
                     }
                 }
             });
             return newSchedule;
        };

        if (userId) {
            setAppData(prev => {
                const newSchedule = invalidateFutureSchedule(prev.wheelchairSchedule);
                return {
                    ...prev,
                    wheelchairUsers: prev.wheelchairUsers.map(u => u.id === userId ? { ...user, id: userId } : u),
                    wheelchairSchedule: newSchedule
                };
            });
            showToast('Uživatel upraven');
        } else {
            setAppData(prev => {
                const newSchedule = invalidateFutureSchedule(prev.wheelchairSchedule);
                return {
                    ...prev,
                    wheelchairUsers: [...prev.wheelchairUsers, { ...user, id: generateId() }],
                    wheelchairSchedule: newSchedule
                };
            });
            showToast('Uživatel přidán');
        }
        onClose();
    };

    return (
        <Modal
            title={userId ? 'Upravit vozíčkáře' : 'Přidat vozíčkáře'}
            onClose={onClose}
            maxWidth="500px"
            footer={<><button className="btn btn-secondary" onClick={onClose}>Zrušit</button><button className="btn btn-primary" onClick={handleSave}>Uložit</button></>}
        >
            <div className="form-row">
                <div className="form-field"><label>Jméno</label><input type="text" value={user.firstName} onChange={e => handleChange('firstName', e.target.value)} /></div>
                <div className="form-field"><label>Příjmení</label><input type="text" value={user.lastName} onChange={e => handleChange('lastName', e.target.value)} /></div>
            </div>
            <div className="form-row">
                <div className="form-field"><label>Čip</label><input type="text" value={user.chip} onChange={e => handleChange('chip', e.target.value)} /></div>
                <div className="form-field"><label>Telefon (nepovinné)</label><input type="tel" value={user.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
            </div>
            <div className="form-group">
                <label>Počáteční směna</label>
                <select value={user.startShift} onChange={e => handleChange('startShift', e.target.value)}>
                    <option value="morning">Ranní</option>
                    <option value="afternoon">Odpolední</option>
                    <option value="night">Noční</option>
                </select>
            </div>
        </Modal>
    );
};

export default WCUserModal;