import React, { useState } from 'react';
import classNames from 'classnames';

import { ISpecialRequestAlert } from 'models/data/IBookingInfo';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

import specialRequestsDrawerAlertsStyles from './ExtrasSpecialRequestsDrawerAlerts.module.scss';

interface ISpecialRequestsDrawerAlertsProps {
    alerts: ISpecialRequestAlert[];
}

function ExtrasSpecialRequestsDrawerAlerts({ alerts }: ISpecialRequestsDrawerAlertsProps) {
    const [opened, setOpen] = useState(false);

    const toggleOpen = () => setOpen(!opened);

    if (alerts.length < 1) {
        return null;
    }

    return (
        <div
            role='presentation'
            onClick={toggleOpen}
            className={classNames({
                [specialRequestsDrawerAlertsStyles.content]: true,
                [specialRequestsDrawerAlertsStyles.opened]: opened,
            })}
        >
            {alerts.map(({ description, message }) => (
                <div key={message} className={specialRequestsDrawerAlertsStyles.alert}>
                    <div className={specialRequestsDrawerAlertsStyles.attention}>
                        <SvgInfoFilled />
                    </div>
                    {!!message && <p className={specialRequestsDrawerAlertsStyles.title}>{message}</p>}
                    {!!description && <p className={specialRequestsDrawerAlertsStyles.text}>{description}</p>}
                </div>
            ))}
            {!opened && <span className={specialRequestsDrawerAlertsStyles.sideFog} />}
            <SvgChevronDown className={specialRequestsDrawerAlertsStyles.chevron} />
        </div>
    );
}

export default ExtrasSpecialRequestsDrawerAlerts;
