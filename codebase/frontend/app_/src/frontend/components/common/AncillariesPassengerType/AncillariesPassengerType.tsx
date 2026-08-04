import React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { getPersonProps } from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { IPassengerFields } from 'models/data/ISeatsAndBagsFields';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import AncillariesPersonDetails from 'frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails';

import styles from './AncillariesPassengerType.module.scss';

export interface IAncillariesPassengerTypeProps {
    numberOfPerson: number;
    outboundPassenger: IFlightPassenger;
    className?: string;
    fields?: { Children: ISitecoreChildren<IPassengerFields>[] };
}

export const AncillariesPassengerType = ({
    fields,
    outboundPassenger,
    numberOfPerson,
    className,
}: IAncillariesPassengerTypeProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!fields?.Children) {
        return null;
    }

    const personProps = getPersonProps(outboundPassenger, fields.Children, numberOfPerson, getPhrase);

    if (!personProps) {
        return null;
    }

    return (
        <div className={classNames(styles.passenger, className)} data-tid='passenger-wrapper'>
            <AncillariesPersonDetails {...personProps} />
        </div>
    );
};

export default AncillariesPassengerType;
