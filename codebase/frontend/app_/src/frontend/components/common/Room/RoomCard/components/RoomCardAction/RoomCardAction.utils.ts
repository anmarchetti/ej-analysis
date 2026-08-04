export const getFormattedPriceLabel = (formattedPriceLabel: string, price: number): string => {
    const prefix = price > 0 ? '+' : '-';

    return `${price ? prefix : ''} ${formattedPriceLabel.replace(/\+|\-/g, '')}`.trim();
};
