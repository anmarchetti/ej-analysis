import { FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { buildFlightPlusHotelUrl } from 'frontend/utils/url.utils';
import { IPopupFields, IPrimaryButtonFields, ISecondaryButtonFields } from 'models/data/BaseFields';
import SitePath from 'models/enum/SitePath';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import LoadingState from 'frontend/components/common/LoadingState/LoadingState';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';

import CustomerCard from './components/CustomerCard/CustomerCard';
import SpecialAssistancePopup from './components/SpecialAssistancePopup/SpecialAssistancePopup';

import styles from './SpecialAssistance.module.scss';

export interface ISpecialAssistanceFields extends IPrimaryButtonFields, ISecondaryButtonFields {
    AssistedRequestedOnLabel: ISitecoreField<string>;
    ContactUsPopup: ISitecoreCompositeField<IPopupFields>;
    ErrorDescription: ISitecoreField<string>;
    ErrorTitle: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    SpecialAssistanceDescription: ISitecoreField<string>;
    SpecialAssistanceTitle: ISitecoreField<string>;
}

export interface ISpecialAssistanceProps {
    fields?: ISpecialAssistanceFields;
}

const SpecialAssistance: FC<ISpecialAssistanceProps> = ({ fields }) => {
    const [isPopupShown, setIsPopupShown] = useState(false);

    const {
        isSpecialAssistanceEnabled,
        daysBeforeDepartureTravelAssistanceCanBeRequested,
        booking,
        isViewBookingStatusPage,
        redirectTo,
        isTradePortal,
        setIsRedirectPreventedAfterLogin,
        toggleLoginPopup,
        guestWithAssistedTravelRequest,
        isAssistedTravelRequestsFailedToLoad,
        isPossibleToRequestAssistedTravel,
        isAssistedTravelRequestsLoading,
        initializeAssistedTravelRequestsFetch,
        isFlightAndHotelPackage,
    } = useStore(stores => ({
        isSpecialAssistanceEnabled: stores.layoutStore.isSpecialAssistanceEnabled,
        isViewBookingStatusPage: isHolidayStore(stores) ? stores.viewBookingStore.isViewBookingStatusPage : false,
        daysBeforeDepartureTravelAssistanceCanBeRequested:
            stores.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested,
        booking: stores.viewBookingStore.booking || stores.bookingStore.booking,
        redirectTo: stores.routerStore.redirectTo,
        isTradePortal: stores.layoutStore.isTradePortal,
        setIsRedirectPreventedAfterLogin: isHolidayStore(stores) && stores.userStore.setIsRedirectPreventedAfterLogin,
        toggleLoginPopup: isHolidayStore(stores) && stores.userStore.toggleLoginPopup,
        guestWithAssistedTravelRequest: isHolidayStore(stores)
            ? stores.viewBookingStore.guestWithAssistedTravelRequest ?? []
            : [],
        isAssistedTravelRequestsFailedToLoad: isHolidayStore(stores)
            ? stores.viewBookingStore.isAssistedTravelRequestsFailedToLoad
            : false,
        isPossibleToRequestAssistedTravel: isHolidayStore(stores)
            ? stores.viewBookingStore.isPossibleToRequestAssistedTravel
            : false,
        isAssistedTravelRequestsLoading: isHolidayStore(stores)
            ? stores.viewBookingStore.isAssistedTravelRequestsLoading
            : false,
        initializeAssistedTravelRequestsFetch: isHolidayStore(stores)
            ? stores.viewBookingStore.initializeAssistedTravelRequestsFetch
            : undefined,
        isFlightAndHotelPackage: isHolidayStore(stores) ? stores.viewBookingStore.isFlightAndHotelPackage : false,
    }));

    useEffect(() => {
        initializeAssistedTravelRequestsFetch?.(true);
    }, [initializeAssistedTravelRequestsFetch]);

    const guests = useMemo(
        () => guestWithAssistedTravelRequest?.filter(guest => !!guest.requestedAt),
        [guestWithAssistedTravelRequest],
    );

    if (!fields || !isSpecialAssistanceEnabled || !booking) {
        return null;
    }

    if (isAssistedTravelRequestsLoading) {
        return <LoadingState useMasonryStyle={isViewBookingStatusPage} />;
    }

    const {
        Icon,
        SpecialAssistanceTitle,
        SpecialAssistanceDescription,
        ContactUsPopup,
        PrimaryButtonLabel,
        SecondaryButtonLabel,
        PrimaryButtonScreenReaderText,
        SecondaryButtonScreenReaderText,
        AssistedRequestedOnLabel,
        ErrorTitle,
        ErrorDescription,
    } = fields;

    const isOnlineFormEnabled =
        isPossibleToRequestAssistedTravel && guests?.length < guestWithAssistedTravelRequest?.length;

    const description = Tokenizer.replaceToken(
        SpecialAssistanceDescription.value,
        Tokens.Days,
        daysBeforeDepartureTravelAssistanceCanBeRequested.toString(),
    );

    const onPrimaryButtonClick = (): void => {
        if (
            !isTradePortal &&
            !booking.isLoggedInAsLeadPassenger &&
            setIsRedirectPreventedAfterLogin &&
            toggleLoginPopup
        ) {
            setIsRedirectPreventedAfterLogin(true);
            toggleLoginPopup();

            return;
        }

        if (isOnlineFormEnabled) {
            redirectTo(
                isFlightAndHotelPackage ? buildFlightPlusHotelUrl(SitePath.AssistedTravel) : SitePath.AssistedTravel,
            );
        }
    };

    const renderGuestCards = (): React.ReactNode => (
        <>
            {isAssistedTravelRequestsFailedToLoad && (
                <InfoBlock title={ErrorTitle} text={ErrorDescription} className={styles.infoBlock} />
            )}
            {!isAssistedTravelRequestsFailedToLoad && guests.length > 0 && (
                <div className={styles.guestCardsContainer}>
                    {guests?.map(guest => {
                        const requestedOnText = Tokenizer.replaceToken(
                            AssistedRequestedOnLabel.value,
                            Tokens.Date,
                            guest.requestedAt,
                        );

                        return (
                            <CustomerCard
                                key={guest.passenger.index}
                                customerName={guest.passengerName}
                                description={requestedOnText}
                            />
                        );
                    })}
                </div>
            )}
        </>
    );

    return (
        <>
            <ViewBookingComponentWrapper
                Icon={Icon}
                Title={SpecialAssistanceTitle}
                PrimaryButtonText={
                    isOnlineFormEnabled || (isPossibleToRequestAssistedTravel && !booking.isLoggedInAsLeadPassenger)
                        ? PrimaryButtonLabel
                        : undefined
                }
                PrimaryButtonScreenReaderText={PrimaryButtonScreenReaderText}
                onPrimaryButtonClick={onPrimaryButtonClick}
                SecondaryButtonText={SecondaryButtonLabel}
                SecondaryButtonScreenReaderText={SecondaryButtonScreenReaderText}
                onSecondaryButtonClick={(): void => setIsPopupShown(true)}
                useMasonryStyle={isViewBookingStatusPage}
                dataTid='special-assistance'
                bottomChildren={renderGuestCards()}
            >
                <RichTextWithLinks
                    tag='div'
                    field={{ value: description }}
                    className={styles.description}
                    dataId='description'
                />
            </ViewBookingComponentWrapper>

            {isPopupShown && (
                <SpecialAssistancePopup onClose={(): void => setIsPopupShown(false)} fields={ContactUsPopup.fields} />
            )}
        </>
    );
};

export default observer(SpecialAssistance);
