import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IPromoBlockProps } from 'models/data/IPromoBlockFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import FeaturedDestinationCard from './FeaturedDestinationCard';

import styles from './FeaturedDestinations.module.scss';

interface IFeaturedDestinationsProps extends IPromoBlockProps {
    titleClassName: string;
}

export const FeaturedDestinations: FC<IFeaturedDestinationsProps> = ({ items, titleClassName }) => {
    const { isLivePriceEnabled, isTouristTaxEnabled, getPhrase } = useStore((stores: TStores) => ({
        isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isTouristTaxTooltipDisplayed = items.some(item => item.isLivePriceValid);

    return (
        <div className={styles.wrapper}>
            <div className='featured-destinations'>
                {items.map(item => (
                    <FeaturedDestinationCard key={item.id} item={item} titleClassName={titleClassName} />
                ))}
            </div>
            {isTouristTaxEnabled && isLivePriceEnabled && isTouristTaxTooltipDisplayed && (
                <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                    <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                </TouristTaxGenericTooltip>
            )}
        </div>
    );
};

export default observer(FeaturedDestinations);
