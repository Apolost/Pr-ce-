import React from 'react';
import type { AppState } from '../types';
import { IconEdit, IconTrash, IconPlus } from '../App';

interface CustomersViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
}

const CustomersView: React.FC<CustomersViewProps> = ({ appData, setAppData, showToast, showConfirmation, setModal }) => {

    const handleDelete = (customerId: string) => {
        const hasOrders = appData.orders.some(o => o.customerId === customerId);
        const hasProducts = appData.products.some(p => p.customerId === customerId);
        const hasActions = appData.plannedActions.some(a => a.customerId === customerId);

        if (hasOrders || hasProducts || hasActions) {
            showToast('Nelze smazat zákazníka, protože má přiřazené objednávky, produkty nebo akce.', 'error');
            return;
        }
        
        const customer = appData.zakaznici.find(c => c.id === customerId);
        if (customer && customer.name.toLowerCase() === 'kfc') {
            showToast('Zákazníka KFC nelze smazat.', 'error');
            return;
        }

        showConfirmation("Opravdu chcete smazat tohoto zákazníka? Tato akce je nevratná.", () => {
            setAppData(prev => {
                const newZakaznici = prev.zakaznici.filter(c => c.id !== customerId);
                const newBoxWeights = { ...prev.boxWeights };
                delete newBoxWeights[customerId];
                
                return {
                    ...prev,
                    zakaznici: newZakaznici,
                    boxWeights: newBoxWeights,
                };
            });
            showToast('Zákazník byl smazán.');
        });
    };

    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{ marginBottom: 0 }}>Správa Zákazníků</h1>
                <button className="btn btn-success" onClick={() => setModal({ name: 'addCustomer' })}>
                    <IconPlus /> Přidat zákazníka
                </button>
            </div>
            <div className="card">
                <div className="card-content">
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Název zákazníka</th>
                                    <th className="actions">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appData.zakaznici.map(customer => (
                                    <tr key={customer.id}>
                                        <td>{customer.name}</td>
                                        <td className="actions">
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => setModal({ name: 'addCustomer', customerId: customer.id })}
                                                aria-label={`Upravit ${customer.name}`}
                                            >
                                                <IconEdit />
                                            </button>
                                            <button 
                                                className="btn-icon danger" 
                                                onClick={() => handleDelete(customer.id)} 
                                                aria-label={`Smazat ${customer.name}`}
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

export default CustomersView;