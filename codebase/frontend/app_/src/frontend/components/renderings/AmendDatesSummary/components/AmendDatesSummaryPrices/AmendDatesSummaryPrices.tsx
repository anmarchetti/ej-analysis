import * as React from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isDefined } from 'frontend/utils/object.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { ScreenViews } from 'models/enum/ScreenViews';
import Callout from 'frontend/components/common/Callout/Callout';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';
import { getAmendDatesPriceLabel } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary.utils';
import AmendDatesSummaryFee from 'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryFee/AmendDatesSummaryFee';

import styles from './AmendDatesSummaryPrices.module.scss';

interface IAmendDatesSummaryPricesProps {
    fields: IAmendDatesSummaryFields;
    tidPostfix: ScreenViews;
    className?: string;
}

const AmendDatesSummaryPrices = ({ fields, className, tidPostfix }: IAmendDatesSummaryPricesProps) => {
    const { prices, formatMoney, isScreenMedium } = useStore((stores: IHolidaysStores) => ({
        prices: stores.amendDatesStore.offerPrices,
        formatMoney: stores.marketStore.formatMoney,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    if (!prices) {
        return null;
    }

    const { ChangeFeeLabel, PreviousCostLabel, NewCostLabel, CostTooltipContent, ShowCostTooltip } = fields;

    const showAmendCharges = isDefined(prices.amendmentDatesCharges);
    const priceLabel = getAmendDatesPriceLabel(fields, prices.amendmentDatesCharges);

    const formattedPreviousPrice = formatMoney(prices.bookingPrice, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });
    const formattedNewPrice = formatMoney(prices.offerPrice, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });
    const formattedAdditionalPrice = formatMoney(prices.amendmentDatesCharges, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });

    return (
        <div data-tid={`amend-dates-summary-prices-${tidPostfix}`} className={classnames(className, styles.prices)}>
            {!!prices.bookingPrice && (
                <div className={styles.item} data-tid='amend-dates-previous-price'>
                    <span data-tid='amend-dates-previous-cost-label'>{PreviousCostLabel?.value}</span>
                    <span data-tid='amend-dates-previous-cost' className={styles.cost}>
                        {formattedPreviousPrice}
                    </span>
                </div>
            )}
            {!!prices.offerPrice && (
                <div className={styles.item} data-tid='amend-dates-new-price'>
                    <span data-tid='amend-dates-new-cost-label'>{NewCostLabel?.value}</span>
                    <div className={styles.priceCount}>
                        <span data-tid='amend-dates-new-cost' className={styles.cost}>
                            {formattedNewPrice}
                        </span>
                        {!!ShowCostTooltip?.value && (
                            <Callout
                                content={<RichTextWithLinks tag='div' field={CostTooltipContent} />}
                                isShownOnHover
                                orientation={isScreenMedium ? CalloutOrientation.Top : CalloutOrientation.Bottom}
                                position={CalloutPosition.Right}
                                className={styles.tooltip}
                            >
                                <div data-tid='amend-dates-price-tooltip'>
                                    <IconInfoCircle />
                                </div>
                            </Callout>
                        )}
                    </div>
                </div>
            )}
            {showAmendCharges && (
                <div className={`${styles.item} ${styles.additionalCost}`} data-tid='amend-dates-additional-cost'>
                    <span data-tid='amend-dates-additional-cost-label' className={styles.label}>
                        {priceLabel?.value}
                    </span>
                    <div className={styles.price}>
                        <span data-tid='amend-dates-additional-price' className={styles.cost}>
                            {formattedAdditionalPrice}
                        </span>
                        {!!prices.amendmentDatesFees && !!ChangeFeeLabel?.value && (
                            <AmendDatesSummaryFee feeLabel={ChangeFeeLabel.value} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(AmendDatesSummaryPrices);
