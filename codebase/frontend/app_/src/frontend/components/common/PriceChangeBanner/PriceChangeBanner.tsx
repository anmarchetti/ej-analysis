import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';

import styles from './PriceChangeBanner.module.scss';

export interface IPriceChangeBanner {
    ReservationNotificationDescription?: ISitecoreField<string>;
    ReservationNotificationTitle?: ISitecoreField<string>;
}

const PriceChangeBanner = ({
    ReservationNotificationDescription,
    ReservationNotificationTitle,
}: IPriceChangeBanner) => {
    const {
        isHotelDetailsBookPage,
        haveSelectedSeats,
        formatMoney,
        isSeatMapFlowEnabled,
        selectedSeatsPrice,
        seatsCurrency,
        extraLuggagePriceTotal,
        isLuxuryPackage,
    } = useStore((stores: TStores) => ({
        formatMoney: stores.marketStore.formatMoney,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isSeatMapFlowEnabled: stores.seatMapStore.isSeatMapFlowEnabled,
        haveSelectedSeats: stores.seatMapStore.haveSelectedSeats,
        selectedSeatsPrice: stores.seatMapStore.selectedSeatsPrice,
        extraLuggagePriceTotal: stores.bookingStore.extraLuggage.extraLuggagePriceTotal,
        ...(isHolidayStore(stores) && {
            seatsCurrency: stores.seatMapStore.currency,
        }),
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));

    const shouldNotRender =
        !isHotelDetailsBookPage ||
        !ReservationNotificationDescription?.value ||
        !ReservationNotificationTitle?.value ||
        isLuxuryPackage;

    if (shouldNotRender) {
        return null;
    }

    let totalReservationPrice = 0;

    if (isSeatMapFlowEnabled && haveSelectedSeats) {
        totalReservationPrice += selectedSeatsPrice ?? 0;
    }

    totalReservationPrice += extraLuggagePriceTotal;

    if (totalReservationPrice === 0) {
        return null;
    }

    ReservationNotificationDescription.value = Tokenizer.replaceTokens(ReservationNotificationDescription?.value, {
        [Tokens.Price]: formatMoney(totalReservationPrice, {
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            currency: seatsCurrency,
        }),
    });

    return (
        <InfoBlock
            title={ReservationNotificationTitle}
            text={ReservationNotificationDescription}
            className={classNames('seats-reservation-notification', styles.container)}
        />
    );
};

export default observer(PriceChangeBanner);
