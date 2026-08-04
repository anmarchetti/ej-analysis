import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';

interface ICurrencyGroup {
    convertedCurrency: string;
    localCurrency: string;
    totalConverted: number;
    totalLocal: number;
}

const createDecimalFormatter = (locale: string): Intl.NumberFormat =>
    new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
    });

const groupByCurrency = (taxesAndFees: TAmendTaxesAndFees): ICurrencyGroup[] => {
    const groups: Record<string, ICurrencyGroup> = {};

    for (const item of taxesAndFees) {
        const key = item.paylocalAmountCurrency;

        if (!groups[key]) {
            groups[key] = {
                localCurrency: item.paylocalAmountCurrency,
                convertedCurrency: item.paylocalAmountConvertedCurrency,
                totalLocal: 0,
                totalConverted: 0,
            };
        }

        groups[key].totalLocal += item.paylocalAmount;
        groups[key].totalConverted += item.paylocalAmountConverted;
    }

    return Object.values(groups);
};

export const buildAmountToken = (taxesAndFees: TAmendTaxesAndFees, locale: string): string => {
    const groups = groupByCurrency(taxesAndFees);
    const formatter = createDecimalFormatter(locale);

    return groups.map(g => `${g.localCurrency} ${formatter.format(g.totalLocal)}`).join(' + ');
};

export const buildRateToken = (taxesAndFees: TAmendTaxesAndFees, locale: string): string => {
    const groups = groupByCurrency(taxesAndFees);
    const formatter = createDecimalFormatter(locale);

    return groups
        .map(g => {
            const rate = g.totalLocal > 0 ? formatter.format(g.totalConverted / g.totalLocal) : formatter.format(0);

            return `${g.localCurrency} 1 = ${g.convertedCurrency} ${rate}`;
        })
        .join(', ');
};
