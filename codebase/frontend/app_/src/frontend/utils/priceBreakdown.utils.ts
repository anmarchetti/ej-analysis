import { toJS } from 'mobx';

import { IExtraPriceBreakdown } from 'models/data/IValidPackageInfo';

export const calculatePriceBreakdown = (
    extraPriceBreakdown: IExtraPriceBreakdown[] | undefined,
): IExtraPriceBreakdown[] => {
    if (!extraPriceBreakdown) return [];

    const sortedPriceBreakdownValue = extraPriceBreakdown
        .flatMap((el: IExtraPriceBreakdown) => {
            if (el.subcategories && (Array.isArray(el.subcategories) || typeof el.subcategories === 'object')) {
                return toJS(el.subcategories);
            }

            return [el];
        })
        .slice()
        // this sort allows us to put negative amount(such as discounts) in the end of displayable array as well as establish alphabetical sorting
        .sort((a, b) => {
            if (a.amount < 0 && b.amount >= 0) return 1;

            if (a.amount >= 0 && b.amount < 0) return -1;

            if (a.amount < 0 && b.amount < 0) return 0;

            return a.name.localeCompare(b.name);
        });

    return sortedPriceBreakdownValue;
};
