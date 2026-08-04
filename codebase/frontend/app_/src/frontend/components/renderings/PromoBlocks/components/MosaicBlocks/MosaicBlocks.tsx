import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksMaxItems } from 'models/enum/PromoBlocksThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import MosaicCarousel from './components/MosaicCarousel/MosaicCarousel';
import MosaicOneRow from './components/MosaicOneRow/MosaicOneRow';
import MosaicTwoRows from './components/MosaicTwoRows/MosaicTwoRows';

import styles from './MosaicBlocks.module.scss';

interface IMosaicBaseProps {
    displayNumberOfNights: boolean;
    items: IPromoBlockFields[];
    onClickItem: (item: IPromoBlockFields) => void;
    titleClassName: string;
}

export type TMosaicRowProps = IMosaicBaseProps;

export interface IMosaicBlocksProps extends IMosaicBaseProps, IComponentWithRerenderProps {
    link?: ISitecoreField<ISitecoreLink>;
}

const MosaicBlocks: FunctionComponent<IMosaicBlocksProps> = ({
    items,
    onClickItem,
    link,
    displayNumberOfNights,
    titleClassName,
}) => {
    const { isTouristTaxEnabled, isMosaicComponentLivePriceEnabled, getPhrase } = useStore((stores: TStores) => ({
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        isMosaicComponentLivePriceEnabled: stores.layoutStore.isMosaicComponentLivePriceEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isXSMobileViewport = useXSMobileViewport();

    const itemCount = items.length;
    const isTouristTaxTooltipDisplayed = items.some(item => item.isLivePriceValid);

    if (!itemCount) {
        return null;
    }

    const getMosaicComponent = (): JSX.Element => {
        const isOneRow = itemCount < PromoBlocksMaxItems.Mosaic;
        const isCarouselView =
            itemCount > PromoBlocksMaxItems.Mosaic ||
            (isXSMobileViewport && itemCount > PromoBlocksMaxItems.MobileView);
        const props = { items, onClickItem, displayNumberOfNights, titleClassName };

        if (isCarouselView) {
            return <MosaicCarousel {...props} />;
        }

        if (isOneRow) {
            return <MosaicOneRow {...props} />;
        }

        return <MosaicTwoRows {...props} />;
    };

    return (
        <div className={classNames(styles.promoSlider)}>
            {getMosaicComponent()}

            <div className={styles.linkBlock} data-tid='link-block'>
                {isTouristTaxEnabled && isMosaicComponentLivePriceEnabled && isTouristTaxTooltipDisplayed && (
                    <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                        <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                    </TouristTaxGenericTooltip>
                )}
                {link?.value?.href && (
                    <RouterLink
                        link={link}
                        className={`btn btn--outlined ${styles.btnLink}`}
                        dataId='mosaic-block-link'
                    >
                        {link.value.text}
                    </RouterLink>
                )}
            </div>
        </div>
    );
};

export default observer(MosaicBlocks);
