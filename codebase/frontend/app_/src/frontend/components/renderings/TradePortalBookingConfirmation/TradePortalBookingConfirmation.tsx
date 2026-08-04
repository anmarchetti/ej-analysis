import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { BookingContext } from 'frontend/context/BookingContext';
import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import BookingErrorPopup from 'frontend/components/common/BookingErrorPopup';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import ViewBookingHotel from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel';
import ViewBookingToolbar from 'frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar';
import ViewBookingHolidayDetails from 'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

interface ITradePortalBookingConfirmationParams {
    FallbackImage: string;
}

interface ITradePortalBookingConfirmationProps
    extends ISitecoreComponent<IViewBookingFields, ITradePortalBookingConfirmationParams>,
        IComponentWithDictionary {
    booking: IBookingInfo;
    isLoadingBookingConfirmationInfo: boolean;
    loadBookingConfirmationInfo: () => void;
    payBalance: () => void;
}

export const TradePortalBookingConfirmation: FunctionComponent<ITradePortalBookingConfirmationProps> = ({
    fields,
    rendering,
    params,
}) => {
    const {
        booking,
        getPhrase,
        loadBookingConfirmationInfo,
        isLoadingBookingConfirmationInfo,
        clearBooking,
        isTradePortal,
    } = useStore((stores: ITradePortalStores) => ({
        booking: stores.bookingStore.booking,
        getPhrase: stores.layoutStore.getPhrase,
        loadBookingConfirmationInfo: stores.bookingStore.loadBookingConfirmationInfo,
        clearBooking: stores.bookingStore.clearBooking,
        isLoadingBookingConfirmationInfo: stores.bookingStore.isLoadingBookingConfirmationInfo,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    useEffect(() => {
        loadBookingConfirmationInfo();

        return () => {
            clearBooking?.();
        };
    }, []);

    const bookingContextValue = useMemo(() => ({ booking }), [booking]);

    if (isLoadingBookingConfirmationInfo) {
        return <OverlaySpinner header={getPhrase(SitecoreDictionary.BookingConfirmationLabelsLoading)} />;
    }

    if (!booking) {
        return null;
    }

    const isLeadLoggedIn = booking.isLoggedInAsLeadPassenger;

    return (
        <BookingContext.Provider value={bookingContextValue}>
            <div className='view-booking'>
                <div>
                    <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />

                    <ViewBookingToolbar
                        booking={booking}
                        isBookingCanceled={false}
                        isLeadLoggedIn={isLeadLoggedIn}
                        rendering={rendering}
                        fields={fields}
                    />
                    <div className='wrapper-container wrapper-container--px'>
                        <ViewBookingHotel
                            booking={booking}
                            fallbackImage={params.FallbackImage}
                            rendering={rendering}
                        />
                    </div>
                </div>

                <div className='wrapper-component-container__inner'>
                    <Placeholder
                        name={PlaceholderNames.AtolProtection}
                        rendering={rendering}
                        isLoggedInUserLead={isLeadLoggedIn}
                        isExternalAgency={booking.isExternalAgency}
                    />
                    <Placeholder name={PlaceholderNames.ViewBookingCost} rendering={rendering} />
                </div>

                <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleStart: '1' }}>
                    <ViewBookingHolidayDetails
                        booking={booking}
                        fields={fields}
                        rendering={rendering}
                        showLeadEmailOnly
                    />

                    {!!booking.healthEntryRequirements?.length && (
                        <Placeholder
                            name={PlaceholderNames.HealthEntryRequirements}
                            rendering={rendering}
                            requirements={booking.healthEntryRequirements}
                        />
                    )}
                </ComponentWrapper>

                <Placeholder name={PlaceholderNames.Feedback} rendering={rendering} />

                {isTradePortal && <BookingErrorPopup />}
            </div>
        </BookingContext.Provider>
    );
};

export default observer(TradePortalBookingConfirmation);
