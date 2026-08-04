import { FC, useMemo } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

interface IShowMoreLinkProps {
    href: string;
    shouldShowPrice: boolean;
    className?: string;
}

export const ShowMoreLink: FC<IShowMoreLinkProps> = ({ href, shouldShowPrice, className }) => {
    const { minPrice, minPricePP, currency, getPhrase, formatMoney } = useStore(stores => ({
        minPrice: stores.hotelsStore.minPrice,
        minPricePP: stores.hotelsStore.minPricePp,
        currency: stores.hotelsStore.currency,
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const price = useMemo(() => {
        const price = formatMoney(minPricePP, { currency, maximumFractionDigits: 0 });

        if (minPricePP !== minPrice) {
            return (
                Tokenizer.replaceToken(
                    getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
                    Tokens.Price,
                    price,
                ) || price
            );
        }

        return price;
    }, [minPrice, minPricePP, currency]);

    return (
        <a href={href} target='_blank' className={className} rel='noreferrer' data-tid='show-more-link'>
            {shouldShowPrice
                ? Tokenizer.replaceToken(
                      getPhrase(SitecoreDictionary.IframePromotingHolidaysLabelsShowMoreWithPrice),
                      Tokens.Price,
                      price,
                  )
                : getPhrase(SitecoreDictionary.IframePromotingHolidaysLabelsShowMore)}
            <IconChevronRight />
        </a>
    );
};

export default ShowMoreLink;
