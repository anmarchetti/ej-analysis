import { FunctionComponent } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Callout from 'frontend/components/common/Callout/Callout';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

import styles from './TotalPrice.module.scss';

interface ITotalPriceProps {
    dataTid: string;
    tooltipLabel?: string;
}

const TotalPrice: FunctionComponent<ITotalPriceProps> = ({ dataTid, tooltipLabel }) => {
    const { getPhrase, totalPrice, formatMoney, currency, amendHotelFeePP } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        totalPrice: stores.amendHotelStore?.newlySelectedHotelOffer?.amendmentChargesInfo?.fullAmendmentCharges,
        currency: stores.marketStore.currency,
        amendHotelFeePP: stores.amendHotelStore.feePP || 0,
    }));

    const pricePP = formatMoney(amendHotelFeePP, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });
    const marketFriendlyPricePP = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
        Tokens.Price,
        pricePP,
    );
    const tooltip = Tokenizer.replaceTokens(tooltipLabel, {
        [Tokens.Price]: marketFriendlyPricePP,
    });

    return (
        <div className={classNames(styles.diagonalCell)} data-tid={dataTid}>
            <div className={classNames(styles.diagonalCellSeparatorLeft)} />
            <div className={classNames(styles.diagonalCellInner)}>
                <div className={classNames(styles.priceTotalLabel)} data-tid={`${dataTid}-label`}>
                    {getPhrase(SitecoreDictionary.PriceSummaryLabelsTotal)}
                </div>
                <div className={classNames(styles.priceLabel)} data-tid={`${dataTid}-value`}>
                    <span>
                        {formatMoney(totalPrice ?? 0, {
                            currency: currency,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                    {!!amendHotelFeePP && (
                        <Callout
                            content={<RichText field={{ value: tooltip }} className={styles.tooltip} />}
                            orientation={CalloutOrientation.Bottom}
                            position={CalloutPosition.Right}
                            isShownOnHover
                        >
                            <i className={styles.tooltipIcon} data-tid={`${dataTid}-more-info-icon`}>
                                <SvgInfoFilled />
                            </i>
                        </Callout>
                    )}
                </div>
            </div>
            <div className={classNames(styles.diagonalCellSeparatorRight)} />
        </div>
    );
};

export default observer(TotalPrice);
