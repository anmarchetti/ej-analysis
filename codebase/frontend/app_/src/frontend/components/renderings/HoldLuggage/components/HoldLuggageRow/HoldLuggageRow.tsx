import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import EditFilled from 'frontend/components/icons-new/EditFilled';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './HoldLuggageRow.module.scss';

export interface IHoldLuggageRowProps {
    description: string;
    icon: string;
    title: string;
    uniqueId: string;
    editLabel?: string;
    feesWarning?: string;
    includedForFreeText?: ISitecoreField<string>;
    onEditClick?: () => void;
    price?: string;
    subtitle?: string;
}

const HoldLuggageRow: FC<IHoldLuggageRowProps> = ({
    title,
    subtitle,
    description,
    icon,
    includedForFreeText,
    price,
    editLabel,
    feesWarning,
    onEditClick,
    uniqueId,
}) => {
    const { isPriceVisible, canAddHoldLuggage, isExtrasPage, isConfirmationPage } = useStore((stores: TStores) => ({
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        canAddHoldLuggage: stores.bookingStore.extraLuggage.canAddHoldLuggage,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
    }));

    return (
        <div
            className={classNames(
                styles.holdLuggageRow,
                !canAddHoldLuggage && styles.noBorder,
                isConfirmationPage && styles.confirmation,
            )}
            data-tid='hold-luggage-row'
        >
            <div className={styles.iconWrap}>
                <img
                    data-tid={`image-${uniqueId}`}
                    src={cmsUrls.media(icon)}
                    alt='Luggage icon'
                    className={styles.icon}
                />
            </div>
            <div className={styles.textBlock}>
                <div>
                    <div className={styles.title}>
                        <span data-tid='hold-luggage-row-title'>{title}</span>

                        {subtitle && (
                            <span className={styles.subtitle} data-tid='hold-luggage-row-subtitle'>
                                &nbsp;{subtitle}
                            </span>
                        )}
                    </div>

                    <div data-tid='hold-luggage-row-description'>{description}</div>
                </div>

                {includedForFreeText && !isConfirmationPage && (
                    <div className={styles.includedLabel} data-tid='hold-luggage-row-included-label'>
                        <Text field={includedForFreeText} tag='span' />
                        <SvgTick className={styles.includedIcon} />
                    </div>
                )}

                {isExtrasPage && price && (
                    <div className={styles.priceBlock} data-tid='hold-luggage-row-price'>
                        {isPriceVisible && (
                            <div className={styles.priceWithFees}>
                                <span data-tid='hold-luggage-row-price-text'>{price}</span>
                                {feesWarning && (
                                    <span className={styles.fees} data-tid='hold-luggage-row-price-fees'>
                                        {feesWarning} <SvgInfoFilled className={styles.warningIcon} />
                                    </span>
                                )}
                            </div>
                        )}

                        {editLabel && onEditClick && (
                            <Button className={styles.priceButton} onClick={onEditClick} isText>
                                {editLabel}
                                <EditFilled className={styles.editIcon} />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(HoldLuggageRow);
