import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ICalloutProps } from 'frontend/components/common/Callout/Callout';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';
import { getAmendDatesPriceLabel } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary.utils';

import AmendBasketHeaderPrice from './AmendBasketHeaderPrice/AmendBasketHeaderPrice';
import AmendSummaryBasketCell from './AmendSummaryBasketCell/AmendSummaryBasketCell';
import {
    getAccommodationItems,
    getFlightsItems,
    getLuggageAndTransportBasketItems,
    IGetBasketItemsParams,
} from './AmendSummaryBasket.utils';

import styles from './AmendSummaryBasket.module.scss';

interface IAmendSummaryBasketProps {
    fields: IAmendDatesSummaryFields;
    calloutProps?: ICalloutProps;
}

const AmendSummaryBasket: FC<IAmendSummaryBasketProps> = ({ fields, calloutProps }) => {
    const {
        isDataExists,
        guestsCounts,
        getPhrase,
        booking,
        offer,
        numberOfNights,
        offerPrices,
        totalHoldLuggageItemsNumber,
    } = useStore((stores: IHolidaysStores) => ({
        isDataExists: !!stores.amendDatesStore.booking && !!stores.amendDatesStore.offer,
        guestsCounts: stores.amendDatesStore.guestsCounts,
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.amendDatesStore.booking,
        offer: stores.amendDatesStore.offer,
        numberOfNights: stores.amendDatesStore.numberOfNights,
        offerPrices: stores.amendDatesStore.offerPrices,
        totalHoldLuggageItemsNumber: stores.amendDatesStore.extraLuggage.totalHoldLuggageItemsNumber,
    }));

    if (!isDataExists) {
        return null;
    }

    const {
        accom: {
            unit: [{ boardType: board }],
        },
    } = offer!;

    const params: IGetBasketItemsParams = {
        guestsCounts,
        getPhrase,
        hotel: booking!.hotel!,
        board,
        units: offer!.accom.unit,
        fields,
        numberOfNights,
        flightRoutes: offer!.transport.routes || [],
        transfer: offer!.transfers[0],
        luggageAmount: totalHoldLuggageItemsNumber + guestsCounts.INFANT,
    };

    const priceLabel = getAmendDatesPriceLabel(fields, offerPrices?.amendmentDatesCharges);

    return (
        <div className={styles.basket}>
            <AmendSummaryBasketCell items={getAccommodationItems(params)} withRightSeparator />
            <AmendSummaryBasketCell items={getFlightsItems(params)} withRightSeparator />
            <AmendSummaryBasketCell items={getLuggageAndTransportBasketItems(params)} className={styles.luggageCell} />
            <AmendBasketHeaderPrice
                feeLabel={fields.ChangeFeeLabel?.value}
                additionalCostLabel={priceLabel?.value}
                calloutProps={calloutProps}
            />
        </div>
    );
};

export default observer(AmendSummaryBasket);
