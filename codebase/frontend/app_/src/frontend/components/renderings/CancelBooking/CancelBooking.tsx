import React, { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import { useChatbotTracking } from 'frontend/hooks/useChatbotTracking/useChatbotTracking';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PriceBreakdown, { IPriceBreakdownFields } from 'frontend/components/common/PriceBreakdown/PriceBreakdown';
import CancellationAccordion, {
    ICancellationAccordionFields,
} from 'frontend/components/renderings/CancelBooking/components/CancellationAccordion/CancellationAccordion';

import CancellationErrorPopup, {
    ICancellationErrorPopupFields,
    IFailedToLoadPopupFields,
} from './components/CancellationErrorPopup/CancellationErrorPopup';
import { generateInitialStateFromSteps, RefundStep, TRefundStepState, usePriceBreakdown } from './CancelBooking.utils';

import styles from './CancelBooking.module.scss';

export type TCancelBookingProps = ISitecoreComponent<ICancelBookingFields>;

export interface ICancelBookingFields
    extends IPriceBreakdownFields,
        ICancellationAccordionFields,
        ICancellationErrorPopupFields,
        IFailedToLoadPopupFields {
    AmountPaidExcludeDeposit: ISitecoreField<string>;
    CancellationChargeLabel: ISitecoreField<string>;
    CancellationChargeTotalLabel: ISitecoreField<string>;
    ChangeFeeLabel: ISitecoreField<string>;
    Deposit: ISitecoreField<string>;
    PaidLabel: ISitecoreField<string>;
    PriceBreakdownTitleStepOne: ISitecoreField<string>;
    TotalCost: ISitecoreField<string>;
}

export const CancelBooking: FC<TCancelBookingProps> = ({ fields }) => {
    const [stepsState, setStepsState] = useState<TRefundStepState>(generateInitialStateFromSteps());

    const {
        initialize,
        booking,
        clearCreditStore,
        initializeCancellationSummaryFetch,
        isOneTimeUseCreditEnabled,
        isCancellationSummaryIsLoading,
        initializeFromPayload,
        isTradePortal,
    } = useStore((stores: TStores) => ({
        initialize: isHolidayStore(stores) && stores.holidayCreditStore.initializeCreditConfirmPage,
        initializeFromPayload: stores.holidayCreditStore.initializeFromPayload,
        booking: stores.holidayCreditStore.booking,
        isCancellationSummaryIsLoading: stores.holidayCreditStore.isCancellationSummaryIsLoading,
        clearCreditStore: stores.holidayCreditStore.clearCreditStore,
        initializeCancellationSummaryFetch: stores.holidayCreditStore.initializeCancellationSummaryFetch,
        isOneTimeUseCreditEnabled: isHolidayStore(stores) && stores.holidayCreditStore.isOneTimeUseCreditEnabled,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));
    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    useEffect(() => {
        initializeFromPayload().then(() => {
            if (isOneTimeUseCreditEnabled || isTradePortal) {
                initializeCancellationSummaryFetch();
            } else {
                initialize && initialize();
            }
        });

        return () => {
            clearCreditStore();
        };
    }, [
        initialize,
        clearCreditStore,
        isOneTimeUseCreditEnabled,
        initializeCancellationSummaryFetch,
        isTradePortal,
        initializeFromPayload,
    ]);

    const { priceBreakdownItems, totalRefund } = usePriceBreakdown(stepsState, fields, isOneTimeUseCreditEnabled);

    useChatbotTracking(booking, containsFAndHPromoCode(booking?.promoCollections || []));

    if (!fields) {
        return null;
    }

    const isHolidaySummaryStep = !stepsState[RefundStep.HolidaySummary].isChecked;

    const { TotalCost, RefundAmount, PriceBreakdownTitleStepOne, PriceBreakdownTitle } = fields;
    const totalPriceLabelField = isHolidaySummaryStep ? TotalCost : RefundAmount;
    const priceBreakdownTitle = isHolidaySummaryStep ? PriceBreakdownTitleStepOne : PriceBreakdownTitle;
    const currency = booking?.paymentInfo.currency ?? CurrencyCode.GBP;

    return (
        <div className={styles.wrapper} data-tid='cancel-booking'>
            <CancellationAccordion
                fields={fields}
                booking={booking}
                setStepsState={setStepsState}
                stepsState={stepsState}
            />
            <PriceBreakdown
                subTotalPrice={!isMoreThenMobileViewport ? totalRefund : undefined}
                totalPrice={totalRefund}
                fields={fields}
                priceBreakdownItems={priceBreakdownItems}
                totalPriceLabelField={totalPriceLabelField}
                priceBreakdownTitle={priceBreakdownTitle}
                currency={currency}
                isLoading={isCancellationSummaryIsLoading}
            />
            <CancellationErrorPopup fields={fields} />
        </div>
    );
};

export default observer(CancelBooking);
