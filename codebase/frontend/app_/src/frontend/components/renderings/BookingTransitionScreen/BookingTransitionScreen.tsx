import { FC, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import BookingTransition from './components/BookingTransition';

export interface IBookingTransitionScreenTile {
    TileDescription: ISitecoreField<string>;
    TileIcon: ISitecoreField<ISitecoreImage>;
    TileTitle: ISitecoreField<string>;
}
export interface IBookingTransitionScreenFields {
    Subtitle: ISitecoreField<string>;
    Tiles: ISitecoreCompositeField<IBookingTransitionScreenTile>[];
    Title: ISitecoreField<string>;
    TransitionMinimumTime: ISitecoreField<number>;
}

export type TBookingTransitionScreenProps = ISitecoreComponent<IBookingTransitionScreenFields>;

const BookingTransitionScreen: FC<TBookingTransitionScreenProps> = ({ fields }) => {
    const {
        isFullMaintenance,
        isLoading,
        isValidatingPackage,
        isNavigationBooking,
        isHotelDetailsBookPage,
        isGuestDetailsPage,
        offer,
    } = useStore(stores => ({
        isFullMaintenance: stores.layoutStore.isFullMaintenance,
        isLoading: stores.appStore.isLoading,
        isValidatingPackage: stores.bookingStore.isValidatingPackage,
        isNavigationBooking: stores.appStore.isNavigationBooking,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isGuestDetailsPage: stores.layoutStore.isGuestDetailsPage,
        offer: stores.bookingStore.selectedOffer,
    }));
    const [isOfferUnavailable] = useState(!offer);
    const [showTransitionScreen, setShowTransitionScreen] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isOfferLoading = isLoading || isValidatingPackage || isNavigationBooking;

    const milisecondsInSecond = 1000;
    const timeout = fields?.TransitionMinimumTime?.value ? milisecondsInSecond * fields.TransitionMinimumTime.value : 0;

    useEffect(() => {
        if (!isOfferLoading) return;

        if (timerRef.current !== null) clearTimeout(timerRef.current);

        setShowTransitionScreen(true);
        timerRef.current = setTimeout(() => {
            setShowTransitionScreen(false);
        }, timeout);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOfferLoading]);

    useEffect(
        () => () => {
            if (timerRef.current !== null) {
                return clearTimeout(timerRef.current);
            }
        },
        [],
    );

    const shouldShow = isOfferLoading || showTransitionScreen;

    // We show the loader only when the page is reloaded.
    // That is, we check whether the offer exists.
    // If it does, it means there was no reload and all the data is available.
    // If it doesn’t, we assume the user navigated from another page and that the offer will be present.
    const isGuestDetailsLoaded = isOfferUnavailable ? !shouldShow : true;

    if (
        !fields ||
        isFullMaintenance ||
        isHotelDetailsBookPage ||
        (isGuestDetailsPage && isGuestDetailsLoaded) ||
        !shouldShow
    ) {
        return null;
    }

    return <BookingTransition {...fields} />;
};

export default observer(BookingTransitionScreen);
