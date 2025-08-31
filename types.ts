export interface Surovina {
    id: string;
    name: string;
    paletteWeight: number;
    stock: number; // Palettes
    stockBoxes?: number; // Loose boxes
    isMix: boolean;
    isActive?: boolean;
}

export interface Zakaznik {
    id: string;
    name: string;
}

export interface OrderItem {
    id: string;
    surovinaId: string;
    boxCount: number;
    ratioOverride?: { surovinaId: string; percentage: number; loss?: number }[];
}

export interface Order {
    id:string;
    date: string;
    customerId: string;
    items: OrderItem[];
    orderType: 'standard' | 'extra' | 'bulk';
}

export interface MixDefinition {
    components: {
        surovinaId: string;
        percentage: number;
        loss?: number;
    }[];
}

export interface Product {
    id: string;
    name: string;
    customerId: string;
    surovinaId: string;
    boxWeight: number;
    marinadeName?: string;
    marinadePercent?: number;
    lossPercent?: number;
    calibratedSurovinaId?: string;
    calibratedWeight?: string;
    isExtra?: boolean;
    isBulk?: boolean;
}

export interface PlannedAction {
    id: string;
    customerId: string;
    surovinaId: string;
    startDate: string;
    endDate?: string;
    dailyCounts: { [date: string]: number };
}

export interface Change {
    id: string;
    dateFrom: string;
    dateTo?: string;
    title: string;
    text: string;
}

export interface WheelchairUser {
    id: string;
    firstName: string;
    lastName: string;
    chip: string;
    phone?: string;
    startShift: 'morning' | 'afternoon' | 'night';
}

export interface WheelchairSchedule {
    [weekKey: string]: { // e.g., '2023-45'
        [dateKey: string]: { // e.g., '2023-11-06'
            morning: string[];
            afternoon: string[];
            night: string[];
            vacation: string[];
        };
    };
}

export interface PCPerson {
    id: string;
    firstName: string;
    lastName: string;
    chip: string;
    phone?: string;
    shift: '1' | '2';
    gender: 'muz' | 'zena';
    position: string;
}

export interface PCEvent {
    id: string;
    chip: string;
    type: 'vacation' | 'sickness' | 'departure' | 'other';
    dateFrom: string;
    dateTo?: string;
}

export interface ToastInfo {
    id: number;
    message: string;
    type: 'success' | 'error';
}

export interface ConfirmationState {
    message: string;
    onConfirm: () => void;
}

export interface KfcComposition {
    baseSurovinaId: string;
    lossPercent: number;
}

export interface DocumentFile {
    id: string;
    name: string;
    path: string; // Will store the Data URL for new files
    fileName: string; // Original file name for download
    folderId: string;
}

export interface DocumentFolder {
    id: string;
    name: string;
}

export interface WorkPosition {
    id: string;
    name: string;
}

export interface AppState {
    suroviny: Surovina[];
    zakaznici: Zakaznik[];
    boxWeights: {
        [customerId: string]: {
            standard?: { [surovinaId: string]: number; };
            extra?: { [surovinaId: string]: number; };
            bulk?: { [surovinaId: string]: number; };
        };
    };
    orders: Order[];
    mixDefinitions: {
        [mixId: string]: MixDefinition;
    };
    kfcCompositions: {
        [kfcProductId: string]: KfcComposition;
    };
    plannedActions: PlannedAction[];
    products: Product[];
    changes: Change[];
    wheelchairUsers: WheelchairUser[];
    wheelchairSchedule: WheelchairSchedule;
    people: PCPerson[];
    peopleEvents: PCEvent[];
    documentFolders: DocumentFolder[];
    documentFiles: DocumentFile[];
    workPositions: WorkPosition[];
    spizyOrdersStatus?: { [date: string]: { [customerId: string]: boolean } };
    extraProductionStatus?: { [date: string]: { [productId: string]: boolean } };
}
