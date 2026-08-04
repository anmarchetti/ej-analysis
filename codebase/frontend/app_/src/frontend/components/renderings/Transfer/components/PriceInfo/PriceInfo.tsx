import React, { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { CurrencyCode, SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './PriceInfo.module.scss';

export interface IPriceInfo {
    UpgradeForFree: ISitecoreField<string>;
    UpgradeForText: ISitecoreField<string>;
    currency: CurrencyCode | undefined;
    isLabelPPShown: boolean;
    isNoTransfer: boolean;
    pricePP: number;
    type: TransferType;
}

const PriceInfo: FunctionComponent<IPriceInfo> = ({
    pricePP,
    isLabelPPShown,
    currency,
    isNoTransfer,
    UpgradeForText,
    UpgradeForFree,
    type,
}) => {
    const { formatMoney } = useStore(stores => ({
        formatMoney: stores.marketStore.formatMoney,
    }));

    if ((!pricePP && pricePP !== 0) || (isNoTransfer && pricePP === 0)) return null;

    return (
        <div className={styles.container} data-tid={`price-container-${type}`}>
            {pricePP === 0 && type === TransferType.Private ? (
                <RichTextWithLinks field={UpgradeForFree} />
            ) : (
                <>
                    {pricePP > 0 && (
                        <>
                            <Text field={UpgradeForText} />{' '}
                        </>
                    )}
                    <PriceLabel
                        price={
                            <span>
                                {formatMoney(pricePP || 0, {
                                    currency,
                                    maximumFractionDigits: 0,
                                    signDisplay: pricePP < 0 ? SignDisplay.ExceptZero : undefined,
                                })}
                            </span>
                        }
                        priceDictionary={isLabelPPShown ? SitecoreDictionary.GlobalsPriceLabelsPerPerson : undefined}
                        dataTid='transfer-price-info'
                    />
                </>
            )}
        </div>
    );
};

export default PriceInfo;
