import classNames from 'classnames';

import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import SeatConfirmationDesktop from './SeatConfirmationDesktop';

interface IInboundOutboundSeatsDesktopProps {
    fields: ISeatsAndBagsFields;
    passengers: IPassengerFlights[];
    isPricesHidden?: boolean;
    isTitleShown?: boolean;
}

const renderFlightsDirection = (text: string, icon: ISitecoreField<ISitecoreImage>) => (
    <div className='flights-desktop__directions'>
        {!!icon?.value && <JSSImage field={icon} className='flights-desktop__img' />}
        {!!text && <span className='flights-desktop__span'>{text}</span>}
    </div>
);

const InboundOutboundSeatsDesktop = ({
    fields,
    passengers,
    isPricesHidden = false,
    isTitleShown = false,
}: IInboundOutboundSeatsDesktopProps) => {
    const { OutboundTitle, ReturnTitle, OutboundIconAlt, ReturnIconAlt } = fields;

    return (
        <>
            <div
                className={classNames(
                    'flights-desktop__directions-wrapper',
                    isTitleShown && 'flights-desktop__directions-wrapper--slim',
                )}
            >
                {renderFlightsDirection(OutboundTitle?.value, OutboundIconAlt)}
                {renderFlightsDirection(ReturnTitle?.value, ReturnIconAlt)}
            </div>
            <>
                {passengers.map((person, numberOfPerson) => (
                    <SeatConfirmationDesktop
                        key={person.outboundPassenger?.passengerId}
                        {...person}
                        fields={fields}
                        numberOfPerson={numberOfPerson + 1}
                        isPricesHidden={isPricesHidden}
                    />
                ))}
            </>
        </>
    );
};

export default InboundOutboundSeatsDesktop;
