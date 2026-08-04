import * as React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getFullPassengerName } from 'frontend/utils/passenger.utils';
import { getPassengerByDisplayName, getTitle, getTitleConstant } from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { GuestType } from 'models/enum/GuestType';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import AncillariesPersonDetails from 'frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails';

import SeatSelectionAndLuggageDesktop from './SeatSelectionAndLuggageDesktop';

interface ISeatConfirmationDesktopProps {
    inboundPassenger: IFlightPassenger;
    numberOfPerson: number;
    outboundPassenger: IFlightPassenger;
    fields?: ISeatsAndBagsFields;
    isPricesHidden?: boolean;
}

const SeatConfirmationDesktop = ({
    outboundPassenger,
    inboundPassenger,
    fields,
    numberOfPerson,
    isPricesHidden = false,
}: ISeatConfirmationDesktopProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!fields?.Children) {
        return null;
    }

    const adultWithInfantFields = getPassengerByDisplayName(fields.Children, PassengerDisplayName.AdultInfant);
    const adultFields = getPassengerByDisplayName(fields.Children, PassengerDisplayName.Adult);
    const childFields = getPassengerByDisplayName(fields.Children, PassengerDisplayName.Child);

    const childAgeToken = {
        [Tokens.PassengerAge]: outboundPassenger.age?.toString() || '',
    };

    const adultInfantTitle = getTitle(
        getFullPassengerName(outboundPassenger, getPhrase),
        adultWithInfantFields?.Title?.value,
    );
    const adultTitle = getTitle(getFullPassengerName(outboundPassenger, getPhrase), adultFields?.Title?.value);
    const childTitle = getTitle(
        getFullPassengerName(outboundPassenger, getPhrase),
        childFields?.Title?.value,
        childAgeToken,
    );

    const adultInfantTitleConstant = getTitleConstant(numberOfPerson, adultWithInfantFields?.TitleConstant?.value);
    const adultTitleConstant = getTitleConstant(numberOfPerson, adultFields?.TitleConstant?.value);
    const childTitleConstant = getTitleConstant(numberOfPerson, childFields?.TitleConstant?.value, childAgeToken);

    return (
        <div className='seat-confirmation seat-confirmation--grid'>
            <div>
                <div className='seat-confirmation__people'>
                    {outboundPassenger.withInfant && outboundPassenger.type === GuestType.Adult && (
                        <AncillariesPersonDetails
                            personIcon={adultFields?.Icon}
                            titleConstant={adultInfantTitleConstant}
                            title={adultInfantTitle}
                        />
                    )}

                    {!outboundPassenger.withInfant && outboundPassenger.type === GuestType.Adult && (
                        <AncillariesPersonDetails
                            personIcon={adultWithInfantFields?.Icon}
                            titleConstant={adultTitleConstant}
                            title={adultTitle}
                        />
                    )}

                    {outboundPassenger.type === GuestType.Child && (
                        <AncillariesPersonDetails
                            personIcon={childFields?.Icon}
                            titleConstant={childTitleConstant}
                            title={childTitle}
                        />
                    )}
                </div>
            </div>

            <div className='seat-confirmation__second-row'>
                <SeatSelectionAndLuggageDesktop
                    seat={outboundPassenger.seat}
                    fields={fields}
                    isPricesHidden={isPricesHidden}
                />
            </div>

            <div className='seat-confirmation__third-row'>
                <SeatSelectionAndLuggageDesktop
                    seat={inboundPassenger.seat}
                    fields={fields}
                    isPricesHidden={isPricesHidden}
                />
            </div>
        </div>
    );
};

export default observer(SeatConfirmationDesktop);
