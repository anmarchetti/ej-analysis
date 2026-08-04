import { useEffect } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IEventParams } from 'models/data/tracking/IEventWithParams';
import { FlightPlusHotelSitePath } from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventLabels } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { usePaymentPriceJumpTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

export const EVENT_ACTION_PAYMENT_JUMP_NAME = 'Delay Price Jump - popup';
export const EVENT_LABEL_ACCEPT = 'Accept new price';
export const EVENT_LABEL_DECLINE = 'Decline new price';

export interface IPaymentJumpProps {
    acceptButton?: ISitecoreField<string>;
    declineButton?: ISitecoreField<string>;
    description?: ISitecoreField<string>;
    title?: ISitecoreField<string>;
}

interface IUsePaymentJumpData {
    descriptionContent: string;
    isPaymentPriceJump: boolean;
    onApproveClick: () => void;
    onDeclineClick: () => void;
}

const usePaymentJump = ({ description }: IPaymentJumpProps): IUsePaymentJumpData => {
    const {
        isPaymentPriceJump,
        priceAfterJump,
        setIsPaymentPriceJump,
        validatePackage,
        formatMoney,
        redirectToSearchResultsPage,
        currency,
        setAmount,
        isDeposit,
        isTradePortal,
        trackEventWithParams,
        isFlightAndHotelPackage,
        buildFlightPlusHotelUrl,
    } = useStore(stores => ({
        isPaymentPriceJump: stores.bookingStore.isPaymentPriceJump,
        priceAfterJump: stores.bookingStore.priceAfterJump,
        setIsPaymentPriceJump: stores.bookingStore.setIsPaymentPriceJump,
        validatePackage: stores.bookingStore.validatePackage,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.marketStore.currency,
        redirectToSearchResultsPage: stores.routerStore.redirectToSearchResultsPage,
        setAmount: stores.payStore.setAmount,
        isDeposit: !isTradeStore(stores) && stores.paymentStore.isDeposit,
        isTradePortal: stores.layoutStore.isTradePortal,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        isFlightAndHotelPackage: !isTradeStore(stores) && stores.bookingStore.isFlightAndHotelPackage,
        buildFlightPlusHotelUrl: stores.queryParamStore.buildFlightPlusHotelUrl,
    }));

    const { trackPaymentPriceJump } = usePaymentPriceJumpTracking();

    useEffect(() => {
        if (isPaymentPriceJump) {
            handleTracking({ eventAction: EVENT_ACTION_PAYMENT_JUMP_NAME, eventLabel: EventLabels.Impression });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPaymentPriceJump]);

    const handleTracking = (data: IEventParams): void => {
        isTradePortal
            ? trackEventWithParams(EventTypes.GenericEvent, data)
            : trackPaymentPriceJump({
                  event_action: data.eventAction,
                  event_label: data.eventLabel?.toString(),
              });
    };

    const onApproveClick = (): void => {
        setIsPaymentPriceJump(false);
        handleTracking({
            eventAction: EVENT_ACTION_PAYMENT_JUMP_NAME,
            eventLabel: EVENT_LABEL_ACCEPT,
        });
        validatePackage();
        !isDeposit && setAmount(priceAfterJump);
    };

    const onDeclineClick = (): void => {
        setIsPaymentPriceJump(false);
        handleTracking({
            eventAction: EVENT_ACTION_PAYMENT_JUMP_NAME,
            eventLabel: EVENT_LABEL_DECLINE,
        });

        if (isFlightAndHotelPackage) {
            globalThis.location.href = buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights, false, true);

            return;
        }

        redirectToSearchResultsPage();
    };

    const price = formatMoney(priceAfterJump, { currency, maximumFractionDigits: 2 });
    const descriptionContent =
        Tokenizer.replaceTokens(description?.value, {
            [Tokens.Price]: `<span data-tid='payment-jump-popup-new-price'>${price}</span>`,
        }) ?? '';

    return {
        descriptionContent,
        onApproveClick,
        onDeclineClick,
        isPaymentPriceJump,
    };
};

export default usePaymentJump;
