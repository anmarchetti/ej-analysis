import { createRef, RefObject, useEffect, useState } from 'react';
import classNames from 'classnames';

import { getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import JSSImage from 'frontend/components/common/JSSImage';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';

import SeatConfirmationMobile from './SeatConfirmationMobile';

const ITEM_PORTION_PREVIEW: number = 82; // preview to show of the 4th passenger (40px) plus padding-bottom (42px) of container 'flights-mobile__item'

interface IInboundOutboundSeatsMobileProps {
    fields: ISeatsAndBagsFields;
    passengers: IPassengerFlights[];
    isInbound?: boolean;
    isPricesHidden?: boolean;
}

const InboundOutboundSeatsMobile = ({
    fields,
    passengers,
    isInbound,
    isPricesHidden = false,
}: IInboundOutboundSeatsMobileProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [maxHeight, setMaxHeight] = useState<number>(0);

    const refs: RefObject<HTMLDivElement>[] = Array(passengers.length)
        .fill(null)
        .map(() => createRef());

    useEffect(() => {
        const maxHeight = refs
            .slice(0, 3)
            .map(({ current }) => (current ? current.getBoundingClientRect().height : 0))
            .reduce((acc, val) => acc + val, 0);

        setMaxHeight(maxHeight);
    }, [refs]);

    const { OutboundTitle, OutboundIcon, ReturnIcon, ReturnTitle, ReadLess, ReadMore } = fields;

    const direction: string = isInbound ? ReturnTitle?.value : OutboundTitle?.value;
    const icon = isInbound ? ReturnIcon : OutboundIcon;
    const readLess: string = ReadLess?.value;
    const readMore: string = ReadMore?.value;
    const isExpandable: boolean = passengers.length > 4;

    const getPassenger = (person: IPassengerFlights): IFlightPassenger =>
        isInbound ? person.inboundPassenger : person.outboundPassenger;

    return (
        <>
            <div className='flights-mobile__directions'>
                <div className='flights-mobile__icon'>
                    <JSSImage field={icon} />
                </div>
                <span className='flights-mobile__span'>{direction}</span>
            </div>
            <div className={classNames(isExpandable && 'flights-mobile__item')}>
                <div
                    className={classNames(
                        isExpandable && 'flights-mobile__expandable',
                        isExpanded && 'flights-mobile__expandable--expanded',
                    )}
                    style={
                        isExpandable
                            ? { height: maxHeight && !isExpanded ? maxHeight + ITEM_PORTION_PREVIEW : '100%' }
                            : {}
                    }
                >
                    {passengers.map((person, numberOfPerson) => {
                        const passenger = getPassenger(person);

                        return (
                            <SeatConfirmationMobile
                                ref={refs[numberOfPerson]}
                                key={passenger.passengerId}
                                passenger={passenger}
                                fields={fields}
                                color={getSeatBorderColor(passenger.seat?.priceBand)}
                                numberOfPerson={numberOfPerson + 1}
                                isPricesHidden={isPricesHidden}
                            />
                        );
                    })}
                </div>
                {isExpandable && (
                    <ReadMoreButton
                        isReadLess={isExpanded}
                        onClick={() => setIsExpanded(!isExpanded)}
                        dataTid={isExpanded ? 'show-more-passengers' : 'show-less-passengers'}
                        readLessText={readLess}
                        readMoreText={readMore}
                    />
                )}
            </div>
        </>
    );
};

export default InboundOutboundSeatsMobile;
