import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFacilityErratas } from 'frontend/utils/facilities.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import PassengerDetails from 'frontend/components/common/Booking/PassengerDetails/PassengerDetails';
import { ErrataMessage } from 'frontend/components/common/ErrataInfo/ErrataMessage';
import ViewBookingHolidayBaseDetails from 'frontend/components/common/ViewBookingHolidayBaseDetails/ViewBookingHolidayBaseDetails';
import { ViewBookingAnchors } from 'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

import { IConfirmationPosterFields } from './Toolbar/components/ConfirmationPoster';

import styles from './ViewBookingHolidayDetails.module.scss';

export interface IBookingHolidayDetailsProps {
    booking: IBookingInfo;
    fields: IViewBookingFields | IConfirmationPosterFields | undefined;
    rendering: any;
    children?: React.ReactNode;
    isPrintPreview?: boolean;
    onAmendFlightsClick?: (e: React.MouseEvent) => void;
    onAmendPassengerClick?: (e: React.MouseEvent) => void;
    onAmendRoomAndBoardClick?: (e: React.MouseEvent) => void;
    onAmendSeatsClick?: (e: React.MouseEvent) => void;
    onAmendTransfersClick?: (e: React.MouseEvent) => void;
    showLeadEmailOnly?: boolean;
}

export interface ILuggageItem {
    quantity: number;
    description?: string;
    icon?: ISitecoreField<ISitecoreImage>;
    name?: string;
}

const ViewBookingHolidayDetails: FC<IBookingHolidayDetailsProps> = ({
    booking,
    fields,
    rendering,
    isPrintPreview,
    onAmendTransfersClick,
    onAmendFlightsClick,
    onAmendSeatsClick,
    onAmendPassengerClick,
    showLeadEmailOnly,
    children,
    onAmendRoomAndBoardClick,
}) => {
    const { isCheckInAvailable } = useStore((stores: TStores) => ({
        isCheckInAvailable: stores.bookingStore.isCheckInAvailable,
    }));

    const isBookingCanceled = booking.bookingStatus === BookingStatus.Canceled;
    const accom = booking.package?.accom;
    const routes = booking.package?.transport?.routes || [];
    const facilityErratas = booking.hotel?.errataFacilities
        ? booking.hotel.errataFacilities.map(item => item.name)
        : getFacilityErratas(accom?.hotel?.facilities || []);

    return (
        <div
            className={classNames('view-booking-holiday-details', styles.viewBookingHolidayDetails)}
            id={ViewBookingAnchors.HolidayDetails.anchorId}
        >
            <ViewBookingHolidayBaseDetails
                booking={booking}
                rendering={rendering}
                fields={fields}
                isPrintPreview={isPrintPreview}
                onAmendTransfersClick={onAmendTransfersClick}
                onAmendFlightsClick={onAmendFlightsClick}
                onAmendSeatsClick={onAmendSeatsClick}
                onAmendRoomAndBoardClick={onAmendRoomAndBoardClick}
            >
                {children}
            </ViewBookingHolidayBaseDetails>
            <PassengerDetails
                guests={booking.guests}
                leadPassenger={booking.leadPassenger}
                flights={routes}
                isExternalAgency={booking.isExternalAgency}
                isLeadLoggedIn={booking.isLoggedInAsLeadPassenger}
                isCheckInAvailable={isCheckInAvailable(booking)}
                isBookingCanceled={isBookingCanceled}
                showLeadEmailOnly={showLeadEmailOnly}
                onAmendPassengerClick={onAmendPassengerClick}
            />
            <Placeholder name={PlaceholderNames.SpecialRequests} rendering={rendering} />
            <ErrataMessage
                errataInfo={booking.errataInfo}
                facilityErratas={facilityErratas}
                className='view-booking-card'
            />
            <Placeholder name={PlaceholderNames.CreditBookingDisruption} rendering={rendering} booking={booking} />
        </div>
    );
};

export default observer(ViewBookingHolidayDetails);
