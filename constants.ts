export const isKfcSurovinaByName = (name: string): boolean => {
    const lowerCaseName = name.toLowerCase();
    return lowerCaseName.includes('kfc');
};

export const BOXES_PER_PALETTE = 20;
