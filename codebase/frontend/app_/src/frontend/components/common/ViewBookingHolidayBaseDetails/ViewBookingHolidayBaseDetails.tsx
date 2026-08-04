import { FunctionComponent } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getGuestsAmountByType } from 'frontend/utils/luggage.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BookingFlights from 'frontend/components/common/Booking/BookingFlights/BookingFlights';
import RoomAndBoard from 'frontend/components/common/Booking/RoomAndBoard/RoomAndBoard';
import Transfers from 'frontend/components/common/Booking/Transfers/Transfers';
import HeaderTextWithIcon from 'frontend/components/common/HeaderTextWIthIcon/HeaderTextWithIcon';
import SvgTicket from 'frontend/components/icons-new/Ticket';
import { IExportHolidayDetailsFields } from 'frontend/components/renderings/ExportHolidayDetails/ExportHolidayDetails';
import HoldLuggageViewBooking from 'frontend/components/renderings/ViewBooking/components/HoldLuggageViewBooking/HoldLuggageViewBooking';
import LuggageBanner from 'frontend/components/renderings/ViewBooking/components/LuggageBanner/LuggageBanner';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

import styles from './ViewBookingHolidayBaseDetails.module.scss';

export type TBookingHolidayBaseDetailsFields = IViewBookingFields | undefined;

export interface IBookingHolidayBaseDetailsProps {
    booking: IBookingInfo;
    fields: TBookingHolidayBaseDetailsFields | IExportHolidayDetailsFields;
    rendering: ComponentRendering;
    children?: React.ReactNode;
    isPrintPreview?: boolean;
    onAmendFlightsClick?: (e: React.MouseEvent) => void;
    onAmendRoomAndBoardClick?: (e: React.MouseEvent) => void;
    onAmendSeatsClick?: (e: React.MouseEvent) => void;
    onAmendTransfersClick?: (e: React.MouseEvent) => void;
}

const ViewBookingHolidayBaseDetails: FunctionComponent<IBookingHolidayBaseDetailsProps> = ({
    booking,
    fields,
    rendering,
    children,
    isPrintPreview,
    onAmendFlightsClick,
    onAmendRoomAndBoardClick,
    onAmendSeatsClick,
    onAmendTransfersClick,
}) => {
    const {
        getPhrase,
        isHideSeatMapWarningMessages,
        isViewBookingPage,
        isConfirmationPage,
        isFlightExternal,
        isFlightAndHotelPackage,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isFlightExternal: stores.viewBookingStore.isFlightExternal,
        isHideSeatMapWarningMessages: isHolidayStore(stores) && stores.seatMapStore.isHideSeatMapWarningMessages,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isFlightAndHotelPackage:
            isHolidayStore(stores) &&
            (stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage),
    }));

    const accom = booking.package?.accom;
    const transfers = booking.transfers || [];
    const routes = booking.package?.transport?.routes || [];
    const rooms = accom?.rooms || [];
    const guestsAmount = getGuestsAmountByType(booking, accom);
    const adultsAndChildrenNumber = guestsAmount.adults + guestsAmount.children;

    const lateCheckoutBanner = booking.lateRoomCheckout ? (
        <Placeholder name='late-checkout-banner' rendering={rendering} />
    ) : undefined;

    // type guard for view booking fields
    const isViewBookingFields = (
        fields?: TBookingHolidayBaseDetailsFields | IExportHolidayDetailsFields,
    ): fields is IViewBookingFields => isViewBookingPage && !!fields;

    const renderLuggage = (): JSX.Element | null => {
        if (isConfirmationPage) {
            return (
                <Placeholder
                    name={PlaceholderNames.Bags}
                    rendering={rendering}
                    adultsAndChildrenNumber={adultsAndChildrenNumber}
                    infantsNumber={guestsAmount.infants}
                />
            );
        }

        if (isViewBookingFields(fields)) {
            return <HoldLuggageViewBooking guestsAmount={guestsAmount} additionalFields={fields} />;
        }

        return null;
    };

    return (
        <>
            <div className={styles.titleWrapper}>
                <HeaderTextWithIcon
                    Icon={SvgTicket}
                    title={getPhrase(
                        isFlightAndHotelPackage
                            ? SitecoreDictionary.BookingSummaryTitlesBookingDetails
                            : SitecoreDictionary.BookingSummaryTitlesHolidayDetails,
                    )}
                />
                {children}
                <BookingFlights
                    onAmendFlightsClick={onAmendFlightsClick}
                    routes={routes}
                    lateCheckoutBanner={lateCheckoutBanner}
                    csMask
                    fields={isViewBookingFields(fields) ? fields : undefined}
                />
            </div>

            <Placeholder
                name={PlaceholderNames.SeatsAndBags}
                rendering={rendering}
                booking={booking}
                onAmendSeatsClick={onAmendSeatsClick}
                forceShowInnerHeading
            />

            {renderLuggage()}

            {isViewBookingFields(fields) && isFlightExternal && (
                <LuggageBanner
                    LuggageDisabledCTA={fields.LuggageDisabledCTA}
                    LuggageDisabledDescription={fields.LuggageDisabledDescription}
                    LuggageDisabledHeader={fields.LuggageDisabledHeader}
                    LuggageInternalDescription={fields.LuggageInternalDescription}
                    LuggageInternalHeader={fields.LuggageInternalHeader}
                />
            )}
            {!isPrintPreview && !isHideSeatMapWarningMessages && (
                <Placeholder name={PlaceholderNames.HoldLuggageInfoBanner} rendering={rendering} />
            )}
            <Transfers
                onAmendTransfersClick={onAmendTransfersClick}
                transfers={transfers || []}
                isIconOrange
                rendering={rendering}
                isPrintPreview={isPrintPreview}
            />

            <RoomAndBoard rooms={rooms || []} isPrintPreview={isPrintPreview} onAmendClick={onAmendRoomAndBoardClick} />
            <Placeholder name={PlaceholderNames.BookedAirportParking} rendering={rendering} />
        </>
    );
};

export default observer(ViewBookingHolidayBaseDetails);
