import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import { getTouristTaxPrice } from './touristTax.utils';

export const getTouristTaxSummaryData = ({
    price: rawPrice = 0,
}: {
    price?: number;
}): {
    label: React.ReactElement;
    price: number;
    trigger: string;
} => {
    const price = getTouristTaxPrice(rawPrice);

    return {
        price,
        label: (
            <RichTextDictionary
                tag='p'
                dictionaryKey={
                    price
                        ? SitecoreDictionary.TouristTaxLabelsLocalTaxes
                        : SitecoreDictionary.TouristTaxLabelsTaxNotApplicable
                }
            />
        ),
        trigger: `£${price}`,
    };
};
