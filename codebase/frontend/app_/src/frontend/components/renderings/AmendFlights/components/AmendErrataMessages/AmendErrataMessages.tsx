import React, { useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AccordionButton from 'frontend/components/common/AccordionButton';
import FlightErrata from 'frontend/components/common/ErrataInfo/FlightErrata';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './amendErrateMessages.module.scss';

interface IAmendFlightErrataMessagesProps {
    errataInfo: string[];
    expandId: string;
    error?: string;
}

function AmendErrataMessages({ errataInfo, expandId, error }: IAmendFlightErrataMessagesProps) {
    const { isScreenLessMedium, getPhrase } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const [expanded, setExpand] = useState(!isScreenLessMedium);

    const toggleExpand = () => {
        setExpand(prev => !prev);
    };

    return (
        <div className='flight-card__flight-errata-info-container'>
            <AccordionButton
                buttonContent={
                    <div className={styles.mobileAction}>
                        <SvgWarningFilled className={styles.attentionIcon} />
                        <span data-tid='amend-errata-message-read-more-label'>
                            {getPhrase(SitecoreDictionary.BookingPaymentLabelsReadBefore)}
                        </span>
                    </div>
                }
                isExpanded={expanded}
                onClick={toggleExpand}
                dataTid='amend-promo'
                panelId={expandId}
                className={styles.expandAction}
            />
            {expanded && (
                <div className={styles.messages} id={expandId}>
                    <FlightErrata dotListStyle={isScreenLessMedium} errataFlightInfo={errataInfo} />
                    {!!error && <ErrorMessage message={error} icon={<IconInfoCircle />} />}
                </div>
            )}
        </div>
    );
}

export default AmendErrataMessages;
