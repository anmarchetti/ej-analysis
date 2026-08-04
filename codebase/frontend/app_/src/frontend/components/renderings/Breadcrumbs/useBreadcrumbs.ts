import { useCallback, useMemo, useState } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import BreadcrumbsPage from 'models/enum/BreadcrumbsPage';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath, { FlightPlusHotelSitePath } from 'models/enum/SitePath';

interface IPopupData {
    cancelLabel: string;
    continueLabel: string;
    subtitle: string;
    title: string;
}

interface IBreadItem {
    href: string;
    key: BreadcrumbsPage | undefined;
    title: string;
    popupData?: IPopupData;
    shouldShowPopup?: boolean;
}

interface IUseBreadcrumbsResult {
    activeItemIndex: number;
    breadItems: IBreadItem[];
    changeIsClickChangeButton: (show: boolean) => void;
    handleBreadcrumbClick: (breadcrumb: IBreadItem) => void;
    handlePopupClose: () => void;
    handlePopupContinue: () => void;
    isExtrasPage: boolean;
    isFlightPlusHotelFunnel: boolean;
    selectedBreadcrumb: IBreadItem | null;
}

const useBreadcrumbs = (activePage: BreadcrumbsPage | undefined): IUseBreadcrumbsResult => {
    const {
        getPhrase,
        buildHotelDetailsQuery,
        hotelDetailsUrl,
        hotel,
        isFlightPlusHotelFunnel,
        buildFlightPlusHotelUrl,
        isExtrasPage,
        changeIsClickChangeButton,
        extraLuggage,
        haveSelectedSeats,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        buildHotelDetailsQuery: stores.queryParamStore.buildHotelDetailsQuery,
        hotelDetailsUrl: stores.routerStore.hotelDetailsUrl,
        hotel: stores.bookingStore.hotel,
        isFlightPlusHotelFunnel: stores.queryParamStore.isFlightPlusHotelFunnel,
        buildFlightPlusHotelUrl: stores.queryParamStore.buildFlightPlusHotelUrl,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        changeIsClickChangeButton: stores.bookingStore.changeIsClickChangeButton,
        extraLuggage: stores.bookingStore.extraLuggage,
        haveSelectedSeats: stores.seatMapStore.haveSelectedSeats,
    }));

    const queryString = buildHotelDetailsQuery();
    const extrasHref = `${SitePath.Extras}${queryString}`;
    const guestsHref = `${SitePath.GuestsDetails}${queryString}`;
    const paymentHref = `${SitePath.Payment}${queryString}`;

    const [selectedBreadcrumb, setSelectedBreadcrumb] = useState<IBreadItem | null>(null);

    const hasExtraLuggage = extraLuggage?.extraLuggageInfo?.items?.some(item => !item.isComplimentary) ?? false;
    const shouldShowBreadcrumbPopup = haveSelectedSeats || hasExtraLuggage;

    const createPopupData = useCallback(
        (stepDictionaryKey: SitecoreDictionary): IPopupData => ({
            title: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupTitle),
            subtitle: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupSubtitle),
            continueLabel: Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupContinue),
                Tokens.Name,
                getPhrase(stepDictionaryKey),
            ),
            cancelLabel: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupCancel),
        }),
        [getPhrase],
    );

    const breadItems = useMemo<IBreadItem[]>(() => {
        if (isFlightPlusHotelFunnel) {
            return [
                {
                    title: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsFlights),
                    key: undefined,
                    href: buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights),
                    shouldShowPopup: shouldShowBreadcrumbPopup,
                    popupData: createPopupData(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsFlights),
                },
                {
                    title: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsHotel),
                    key: undefined,
                    href: buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true),
                    shouldShowPopup: shouldShowBreadcrumbPopup,
                    popupData: createPopupData(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsHotel),
                },
                {
                    title: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsExtras),
                    key: BreadcrumbsPage.Extras,
                    href: extrasHref,
                },
                {
                    title: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsGuests),
                    key: BreadcrumbsPage.Guests,
                    href: guestsHref,
                },
                {
                    title: getPhrase(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsCheckout),
                    key: BreadcrumbsPage.Payment,
                    href: paymentHref,
                },
            ];
        }

        return [
            {
                title: getPhrase(SitecoreDictionary.BreadcrumbsLabelsHoliday),
                key: BreadcrumbsPage.Holiday,
                href: hotelDetailsUrl(hotel, queryString),
            },
            {
                title: getPhrase(SitecoreDictionary.BreadcrumbsLabelsExtras),
                key: BreadcrumbsPage.Extras,
                href: extrasHref,
            },
            {
                title: getPhrase(SitecoreDictionary.BreadcrumbsLabelsGuest),
                key: BreadcrumbsPage.Guests,
                href: guestsHref,
            },
            {
                title: getPhrase(SitecoreDictionary.BreadcrumbsLabelsPayment),
                key: BreadcrumbsPage.Payment,
                href: paymentHref,
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isFlightPlusHotelFunnel,
        extrasHref,
        guestsHref,
        paymentHref,
        hotel,
        shouldShowBreadcrumbPopup,
        getPhrase,
        buildFlightPlusHotelUrl,
    ]);

    const activeItemIndex = breadItems.findIndex(el => el.key === activePage);

    const handleBreadcrumbClick = (breadcrumb: IBreadItem): void => {
        setSelectedBreadcrumb(breadcrumb);
    };

    const handlePopupClose = (): void => {
        setSelectedBreadcrumb(null);
    };

    const handlePopupContinue = (): void => {
        setSelectedBreadcrumb(null);

        if (selectedBreadcrumb?.href) {
            globalThis.location.href = selectedBreadcrumb.href;
        }
    };

    return {
        breadItems,
        activeItemIndex,
        isExtrasPage,
        isFlightPlusHotelFunnel,
        changeIsClickChangeButton,
        selectedBreadcrumb,
        handleBreadcrumbClick,
        handlePopupClose,
        handlePopupContinue,
    };
};

export default useBreadcrumbs;
