import React, { useState } from 'react';
import type { AppState } from '../types';
// FIX: import IconTrash component from App.tsx instead of non-existent ICONS from constants.
import { IconTrash } from '../App';

interface OrdersViewProps {
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ selectedDate, appData, setAppData, showConfirmation, setModal }) => {
    
    const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

    const handleBoxCountChange = (orderId: string, itemId: string, count: number) => {
        setAppData(prev => ({
            ...prev,
            orders: prev.orders.map(o => 
                o.id === orderId 
                ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, boxCount: count } : i) }
                : o
            )
        }));
    };
    
    const handleDeleteOrderItem = (orderId: string, itemId: string, customerId: string) => {
        showConfirmation("Opravdu si přejete smazat tuto položku z objednávky?", () => {
            setAppData(prev => {
                const newOrders = prev.orders.map(order => {
                    if (order.id !== orderId) return order;
                    return { ...order, items: order.items.filter(item => item.id !== itemId) };
                }).filter(order => order.items.length > 0);
                return { ...prev, orders: newOrders };
            });
             setOpenAccordionId(customerId);
        });
    };

    return (
        <div>
            <h1 className="page-header">Objednávky</h1>
            <div className="accordion">
                {appData.zakaznici.map(customer => {
                    const customerOrders = appData.orders.filter(o => o.customerId === customer.id && o.date === selectedDate);
                    
                    return (
                        <details 
                            key={customer.id} 
                            open={openAccordionId === customer.id}
                            onToggle={(e) => {
                                if ((e.target as HTMLDetailsElement).open) {
                                    setOpenAccordionId(customer.id);
                                } else if (openAccordionId === customer.id) {
                                    setOpenAccordionId(null);
                                }
                            }}
                        >
                            <summary>{customer.name}</summary>
                            <div className="details-content">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Produkt</th>
                                            <th>Počet beden</th>
                                            <th className="actions">Akce</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerOrders.length > 0 ? customerOrders.flatMap(order => 
                                            order.items.map(item => {
                                                const surovina = appData.suroviny.find(s => s.id === item.surovinaId);
                                                return (
                                                    <tr key={item.id}>
                                                        <td>{surovina?.name || 'N/A'}</td>
                                                        <td>
                                                            <input 
                                                                type="number" 
                                                                value={item.boxCount}
                                                                onChange={(e) => handleBoxCountChange(order.id, item.id, parseInt(e.target.value) || 0)}
                                                                style={{width: '80px'}}
                                                            />
                                                        </td>
                                                        <td className="actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                                                            {surovina?.isMix && (
                                                                <button className="btn btn-secondary btn-sm" onClick={() => setModal({name: 'mixRatio', orderId: order.id, itemId: item.id})}>Poměr</button>
                                                            )}
                                                             {/* FIX: Use IconTrash component instead of dangerouslySetInnerHTML */}
                                                             <button className="btn-icon danger" onClick={() => handleDeleteOrderItem(order.id, item.id, customer.id)}><IconTrash /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan={3}>Žádné objednávky pro tento den.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                                {/* FIX: Provide buttons to add items for each order type to pass 'orderType' to the modal. */}
                                <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button className="btn btn-success" onClick={() => setModal({ name: 'addOrder', customerId: customer.id, orderType: 'standard' })}>+ Přidat (OA RB)</button>
                                    <button className="btn btn-primary" onClick={() => setModal({ name: 'addOrder', customerId: customer.id, orderType: 'extra' })}>+ Přidat (Extra)</button>
                                    <button className="btn btn-secondary" onClick={() => setModal({ name: 'addOrder', customerId: customer.id, orderType: 'bulk' })}>+ Přidat (Volně)</button>
                                </div>
                            </div>
                        </details>
                    )
                })}
            </div>
        </div>
    );
};

export default OrdersView;