import React, { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { TransferType } from 'models/enum/transfer/TransferType';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import { ITransferFields } from 'frontend/components/renderings/Transfer/Transfer';

import styles from './SportEquipmentFees.module.scss';

export interface ISportEquipmentFeesProps {
    type: TransferType;
    fields?: ITransferFields;
    largeSeSurcharge?: number;
    smallSeSurcharge?: number;
}

const SportEquipmentFees: FunctionComponent<ISportEquipmentFeesProps> = ({
    type,
    fields,
    largeSeSurcharge,
    smallSeSurcharge,
}) => {
    const { currency, hasSportEquipment, formatMoney, isPriceVisible } = useStore(stores => ({
        currency: stores.marketStore.currency,
        hasSportEquipment: !!stores.bookingStore.extraLuggage.sportEquipmentNumber,
        formatMoney: stores.marketStore.formatMoney,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
    }));
    const isShared = type === TransferType.Shared;
    const isPrivate = type === TransferType.Private;

    if (!isShared && !isPrivate) return null;

    if (isShared && ((!largeSeSurcharge && !smallSeSurcharge) || !hasSportEquipment)) return null;

    if (isPrivate && !hasSportEquipment) return null;

    const {
        SharedFeesTitle,
        SingleSharedFeesDescription,
        MultipleSharedFeesDescription,
        SharedFeesDescriptionPriceHidden,
        PrivateFeesTitle,
        PrivateFeesDescription,
    } = fields || {};

    const getBannerContent = () => {
        if (isShared) {
            let sportFeesText;

            if (largeSeSurcharge && smallSeSurcharge) {
                sportFeesText = Tokenizer.replaceTokens(MultipleSharedFeesDescription?.value, {
                    [Tokens.PriceSmall]: formatMoney(Number(smallSeSurcharge), {
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        currency,
                    }),
                    [Tokens.PriceLarge]: formatMoney(Number(largeSeSurcharge), {
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        currency,
                    }),
                });
            } else {
                sportFeesText = Tokenizer.replaceTokens(SingleSharedFeesDescription?.value, {
                    [Tokens.Price]: formatMoney(Number(smallSeSurcharge || largeSeSurcharge), {
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        currency,
                    }),
                });
            }

            return {
                title: SharedFeesTitle,
                description: !isPriceVisible ? SharedFeesDescriptionPriceHidden?.value : sportFeesText,
            };
        }

        if (isPrivate) {
            return {
                title: PrivateFeesTitle,
                description: PrivateFeesDescription?.value,
            };
        }

        return {};
    };

    const { title, description } = getBannerContent();

    return (
        <div className={styles.warning} data-tid='sport-equipment-transfer-fees'>
            <div className='d-md-block d-none'>
                <div className={styles.warningContainer}>
                    <SvgInfoFilled className={styles.warningIcon} />
                    <div>
                        <Text tag='span' className={styles.warningTitle} field={title} />
                        {description && <span>{description}</span>}
                    </div>
                </div>
            </div>
            <div className='d-md-none'>
                {title?.value && (
                    <ExpandableItem
                        className={styles.warningContainerMobile}
                        contentClassName={styles.contentMobile}
                        title={title.value}
                        titleClassName={styles.warningTitle}
                        icon={<SvgInfoFilled className={styles.warningIcon} />}
                    >
                        {description && <span>{description}</span>}
                    </ExpandableItem>
                )}
            </div>
        </div>
    );
};

export default observer(SportEquipmentFees);
