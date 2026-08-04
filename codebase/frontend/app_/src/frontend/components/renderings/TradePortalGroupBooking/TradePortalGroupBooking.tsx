import { withDatasourceCheck } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { ISitecoreAirport } from 'models/sitecore/IAirportsData';

import GroupBookingForm from './components/GroupBookingForm/GroupBookingForm';
import GroupBookingHeader from './components/GroupBookingHeader/GroupBookingHeader';
import GroupBookingSuccess from './components/GroupBookingSuccess/GroupBookingSuccess';
import { useGroupBookingStore, withGroupBookingStore } from './store/createStore';

interface ITradePortalGroupBookingFormErrors {
    ABTAorAgentNumRequiredError: ISitecoreField<string>;
    AgentEmailRequiredError: ISitecoreField<string>;
    AgentNameRequiredError: ISitecoreField<string>;
    BoardsError: ISitecoreField<string>;
    DepartureAirportError: ISitecoreField<string>;
    DepartureDateError: ISitecoreField<string>;
    DestinationError: ISitecoreField<string>;
    DurationOfHolidayError: ISitecoreField<string>;
    GeneralInvalidError: ISitecoreField<string>;
    GeneralLimitError: ISitecoreField<string>;
}

interface IOrderItem {
    fields: {
        Value: ISitecoreField<string>;
    };
}

interface ITradePortalGroupBookingHeaderFields {
    Image: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface ITradePortalGroupBookingFormFields {
    AdditionalDetailsLabel: ISitecoreField<string>;
    AdditionalDetailsPlaceholder: ISitecoreField<string>;
    AgentEmailPlaceholder: ISitecoreField<string>;
    AgentInfoTitle: ISitecoreField<string>;
    AgentNamePlaceholder: ISitecoreField<string>;
    AgentNumberPlaceholder: ISitecoreField<string>;
    BoardsLabel: ISitecoreField<string>;
    BoardsList: IOrderItem[];
    BoardsNote: ISitecoreField<string>;
    CustomersInfoDescription: ISitecoreField<string>;
    CustomersInfoTitle: ISitecoreField<string>;
    CustomersInfoTotal: ISitecoreField<string>;
    DepartureAirportLabel: ISitecoreField<string>;
    DepartureAirportsList: ISitecoreCompositeField<ISitecoreAirport>[];
    DepartureDateLabel: ISitecoreField<string>;
    DestinationLabel: ISitecoreField<string>;
    DestinationNote: ISitecoreField<string>;
    DurationOfHolidayLabel: ISitecoreField<string>;
    DurationOfHolidayNote: ISitecoreField<string>;
    FormDescription: ISitecoreField<string>;
    FormTitle: ISitecoreField<string>;
    IsFlexibleLabel: ISitecoreField<string>;
    IsFlexibleTooltipContent: ISitecoreField<string>;
    NumberOfRoomsLabel: ISitecoreField<string>;
    SubmitCTAText: ISitecoreField<string>;
    TotalCountErrorDescription: ISitecoreField<string>;
    TotalCountErrorTitle: ISitecoreField<string>;
}

interface ITradePortalGroupBookingSuccessWindow {
    BackToHomeCTAText: ISitecoreField<string>;
    SuccessDescription: ISitecoreField<string>;
    SuccessTitle: ISitecoreField<string>;
}

export interface ITradePortalGroupBookingFields
    extends ITradePortalGroupBookingFormErrors,
        ITradePortalGroupBookingHeaderFields,
        ITradePortalGroupBookingFormFields,
        ITradePortalGroupBookingSuccessWindow {}

export type TTradePortalGroupBookingProps = ISitecoreComponent<ITradePortalGroupBookingFields>;

export const TradePortalGroupBooking = ({ fields, rendering }: TTradePortalGroupBookingProps) => {
    const { isSuccess } = useGroupBookingStore();

    if (!fields) {
        return null;
    }

    return (
        <div>
            {isSuccess ? (
                <GroupBookingSuccess fields={fields} />
            ) : (
                <section>
                    <GroupBookingHeader fields={fields} rendering={rendering} />
                    <div className='wrapper-component-container'>
                        <div className='wrapper-component-container__inner mb-5'>
                            <GroupBookingForm fields={fields} />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default withDatasourceCheck()(withGroupBookingStore(observer(TradePortalGroupBooking)));
