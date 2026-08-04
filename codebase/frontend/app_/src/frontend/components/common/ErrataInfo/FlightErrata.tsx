import React from 'react';
import classNames from 'classnames';

import IconInfoCircle from 'frontend/components/icons/InfoCircle';

export interface IFlightErrataProps {
    dotListStyle?: boolean;
    errataFlightInfo?: string[];
}

export const FlightErrata: React.FC<IFlightErrataProps> = ({ errataFlightInfo, dotListStyle }) => {
    if (!errataFlightInfo?.length) return null;

    return (
        <div className='flight-errata' data-tid='flight-errata'>
            <ul className={classNames('flight-errata__items', dotListStyle && 'flight-errata__items--dot')}>
                {errataFlightInfo.map((errata, i) => (
                    <li key={i} className='flight-errata__item'>
                        {!dotListStyle && (
                            <span className='flight-errata__icon'>
                                <IconInfoCircle />
                            </span>
                        )}
                        <div
                            data-tid='flight-errata-message'
                            className='flight-errata__container'
                            dangerouslySetInnerHTML={{ __html: errata }}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FlightErrata;
