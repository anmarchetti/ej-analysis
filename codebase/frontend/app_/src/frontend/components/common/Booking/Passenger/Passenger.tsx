import React, { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFullPassengerName, getLeadPassengerAddress } from 'frontend/utils/passenger.utils';
import { IGuestPassenger, ILeadPassenger } from 'models/data/ILeadPassenger';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgUserFilled from 'frontend/components/icons-new/UserFilled';
import SvgUserLined from 'frontend/components/icons-new/UserLined';

import styles from './Passenger.module.scss';

interface IPassengerProps {
    passenger: IGuestPassenger;
    className?: string;
    flightRef?: Nullable<string>;
    isExternalAgency?: boolean;
    isLeadLoggedIn?: boolean;
    leadPassenger?: ILeadPassenger;
    showFlightLabel?: boolean;
    showLeadEmailOnly?: boolean;
}

export const Passenger: FC<IPassengerProps> = ({
    passenger,
    leadPassenger,
    isExternalAgency,
    isLeadLoggedIn,
    showFlightLabel,
    flightRef,
    showLeadEmailOnly,
    className,
}) => {
    const { getPhrase, isConfirmationPage, isTradePortal } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));
    const showLeadDetails =
        (isTradePortal || !isExternalAgency) &&
        !!leadPassenger &&
        (isLeadLoggedIn || isConfirmationPage || (!isConfirmationPage && isTradePortal));

    let label: string | undefined;

    if (showFlightLabel) {
        label = flightRef
            ? getPhrase(SitecoreDictionary.BookingPassengersLabelsLeadPassenger)
            : getPhrase(SitecoreDictionary.BookingPassengersLabelsLeadPassengerNoFlightRef);
    } else if (showLeadDetails) {
        label = getPhrase(SitecoreDictionary.BookingPassengersLabelsLeadPassenger);
    }

    const renderPassengerInfoItem = (dictionary: string, value: string): JSX.Element => (
        <div data-tid='passenger-info-item' className={styles.infoItem}>
            <span data-tid='passenger-info-label' className={styles.label}>
                {getPhrase(dictionary)}
            </span>
            <span data-tid='passenger-info-value' className={styles.value} data-cs-mask>
                {value}
            </span>
        </div>
    );

    const UserIcon = leadPassenger ? SvgUserFilled : SvgUserLined;

    return (
        <div className={classNames(styles.guestWithIcon, className)}>
            <UserIcon className={styles.icon} />
            <div data-tid='guest' className={styles.guest}>
                <div className={styles.head}>
                    <h3
                        data-tid='guest-name'
                        className={classNames(styles.guestName, { [styles.withFlightRef]: showFlightLabel })}
                    >
                        <span data-tid='lead-name' data-cs-mask>
                            {getFullPassengerName(passenger, getPhrase)}
                        </span>
                        {!!label && (
                            <span data-tid='lead-label' className={styles.leadLabel}>
                                {label}
                            </span>
                        )}
                    </h3>
                </div>

                {showLeadDetails && !!leadPassenger && (
                    <div data-tid='passenger-info' className={styles.info}>
                        {renderPassengerInfoItem(SitecoreDictionary.BookingPassengersLabelsEmail, leadPassenger.email)}
                        {!showLeadEmailOnly && (
                            <>
                                {renderPassengerInfoItem(
                                    SitecoreDictionary.BookingPassengersLabelsAddress,
                                    getLeadPassengerAddress(leadPassenger),
                                )}
                                {renderPassengerInfoItem(
                                    SitecoreDictionary.BookingPassengersLabelsTownCity,
                                    leadPassenger.townCity,
                                )}
                                {!!leadPassenger.postCode &&
                                    renderPassengerInfoItem(
                                        SitecoreDictionary.BookingPassengersLabelsPostcode,
                                        leadPassenger.postCode.toUpperCase(),
                                    )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Passenger;
