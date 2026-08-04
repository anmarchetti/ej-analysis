import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';

import styles from './SeatInfoMessages.module.scss';

export interface ISeatInfoMessagesProps {
    fields: ISeatsAndBagsFields;
    shouldShowInfoMessage?: boolean;
    shouldShowNotAvailableMessage?: boolean;
    shouldShowOutOfSyncMessage?: boolean;
    shouldShowWarning?: boolean;
}

const SeatInfoMessages: FC<ISeatInfoMessagesProps> = ({
    fields,
    shouldShowInfoMessage,
    shouldShowOutOfSyncMessage,
    shouldShowNotAvailableMessage,
    shouldShowWarning,
}) => {
    const { isPostBookingsPages } = useStore((stores: TStores) => ({
        isPostBookingsPages: stores.layoutStore.isPostBookingPages,
    }));

    const postBookClassName = isPostBookingsPages ? styles.withoutShadow : '';

    return (
        <>
            {shouldShowNotAvailableMessage && (
                <InfoBlock
                    title={fields.SeatsSwitchedOffTitle}
                    text={fields.SeatsSwitchedOff}
                    className={classNames(styles.failureBanner, postBookClassName)}
                    dataTid='seats-switched-off'
                />
            )}
            {shouldShowWarning && (
                <InfoBlock
                    title={fields.ErrorDepartureMessageTitle}
                    text={fields.ErrorDepartureMessage}
                    className={classNames(styles.failureBanner, postBookClassName)}
                    withWarningIcon
                    dataTid='seats-unavailable'
                />
            )}

            {shouldShowInfoMessage && (
                <InfoBlock
                    title={fields.SeriesSeatFlightsTitle}
                    className={classNames(styles.failureBanner, styles.infoMessage, postBookClassName)}
                    text={fields.SeriesSeatFlights}
                    dataTid='seats-unavailable-30-days-before-departure'
                />
            )}

            {shouldShowOutOfSyncMessage && (
                <InfoBlock
                    title={fields.BookingOutOfSyncTitle}
                    className={classNames(styles.failureBanner, postBookClassName)}
                    text={fields.BookingOutOfSync}
                    dataTid='view-selected-seats'
                />
            )}
        </>
    );
};

export default SeatInfoMessages;
