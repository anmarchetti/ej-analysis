import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { ISpecialRequestContradictoryGroup, ISpecialRequestsType } from 'models/data/SpecialRequest';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import BookingSpecialRequests from './components/BookingSpecialRequests/BookingSpecialRequests';
import ExtrasSpecialRequests from './components/ExtrasSpecialRequests/ExtrasSpecialRequests';
import { IAddAssistanceFields } from './components/SpecialAssistance/SpecialAssistance';
import { withSRLocalStore } from './stores/createLocalStore';

export interface ISpecialRequestsFields extends IAddAssistanceFields {
    AddRequestDescription: ISitecoreField<string>;
    AddRequestTitle: ISitecoreField<string>;
    AddRequestsCTA: ISitecoreField<string>;
    AmendRequestIcon: ISitecoreField<ISitecoreImage>;

    AmendmentPopupDescription: ISitecoreField<string>;
    AmendmentPopupTitle: ISitecoreField<string>;
    ContradictoryNewSelectionTitle: ISitecoreField<string>;
    ContradictoryOriginalSelectionTitle: ISitecoreField<string>;
    ContradictoryPopupDescription: ISitecoreField<string>;

    ContradictoryPopupTitle: ISitecoreField<string>;
    Description: ISitecoreField<string>;

    EditRequestsCTA: ISitecoreField<string>;
    InfoCTA: ISitecoreField<string>;
    InfoDescription: ISitecoreField<string>;
    InfoDescriptionViewBooking: ISitecoreField<string>;
    InfoIcon: ISitecoreField<ISitecoreImage>;

    InfoTitle: ISitecoreField<string>;
    SpecialRequestsContradictoryGroups: ISpecialRequestContradictoryGroup[];
    SpecialRequestsTypes: ISpecialRequestsType[];
    Title: ISitecoreField<string>;

    ViewBookingContentRequestSubtitle: ISitecoreField<string>;
    ViewBookingContentRequestTitle: ISitecoreField<string>;
}

export interface ISpecialRequestsParams {
    IsSleekDesign: TSitecoreCheckboxValue;
}

export type TSpecialRequestsProps = ISitecoreComponent<ISpecialRequestsFields, ISpecialRequestsParams>;

export const SpecialRequests: FC<TSpecialRequestsProps> = ({ fields, params }) => {
    const { viewBooking, confirmationBooking, isViewBookingStatusPage, isPostBookingPages } = useStore(
        (stores: TStores) => ({
            viewBooking: stores.viewBookingStore.booking,
            confirmationBooking: stores.bookingStore.booking,
            isViewBookingStatusPage: isHolidayStore(stores) && stores.viewBookingStore.isViewBookingStatusPage,
            isPostBookingPages: stores.layoutStore.isPostBookingPages,
        }),
    );

    const booking = viewBooking || confirmationBooking;
    const isShowBookingSpecialRequests = (isPostBookingPages || isViewBookingStatusPage) && !!booking;

    return isShowBookingSpecialRequests ? (
        <BookingSpecialRequests
            fields={fields}
            params={params}
            booking={booking}
            withAmendment={!booking.isExternalAgency}
        />
    ) : (
        <ExtrasSpecialRequests fields={fields} />
    );
};

export default observer(withSRLocalStore(SpecialRequests));
