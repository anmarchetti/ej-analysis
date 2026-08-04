import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import ConditionalWrapper from 'frontend/components/common/ConditionalWrapper/ConditionalWrapper';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './PriceContent.module.scss';

export interface IPriceContentProps {
    link: ISitecoreField<ISitecoreLink>;
    livePrice: Nullable<ILivePrice>;
    isExternalExtras?: boolean;
    price?: ISitecoreField<string>;
    pricePrefix?: ISitecoreField<string>;
}

export const PriceContent: React.FC<IPriceContentProps> = ({
    link,
    livePrice,
    pricePrefix,
    price,
    isExternalExtras,
}) => {
    const { formatMoney } = useStore((stores: TStores) => ({
        formatMoney: stores.marketStore.formatMoney,
    }));
    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom);

    if (!livePrice && !price) {
        return null;
    }

    const renderLivePriceContent = (livePrice: ILivePrice) => (
        <div className={styles.priceContainer} data-tid='live-price-content'>
            <span data-tid='live-price-label-before' className={styles.priceContainerPrefix}>
                {labelBeforePrice}
            </span>
            <div>
                <span className={styles.priceContainerPrice} data-tid='live-price'>
                    {formatMoney(livePrice.pricePP, { currency: livePrice.currency, maximumFractionDigits: 0 })}
                </span>
                <span data-tid='live-price-label-after' className={styles.priceContainerSuffix}>
                    {labelAfterPrice}
                </span>
            </div>
        </div>
    );

    return (
        <ConditionalWrapper
            condition={!!link?.value?.href}
            wrapper={(children: JSX.Element) => (
                <RouterLink link={link} className={styles.priceWrapper}>
                    {children}
                </RouterLink>
            )}
        >
            {livePrice ? (
                renderLivePriceContent(livePrice)
            ) : (
                <div
                    className={classNames(styles.priceContainer, { [styles.priceContainerAlt]: isExternalExtras })}
                    data-tid='regular-price-content'
                >
                    {pricePrefix && (
                        <span
                            data-tid='price-content-prefix'
                            className={classNames(styles.priceContainerPrefix, {
                                [styles.alignRight]: isExternalExtras,
                            })}
                        >
                            {pricePrefix.value}
                        </span>
                    )}
                    <div
                        className={styles.priceContainerPrice}
                        data-tid='price-content'
                        dangerouslySetInnerHTML={{ __html: price?.value || '' }}
                    />
                </div>
            )}
        </ConditionalWrapper>
    );
};

export default observer(PriceContent);
