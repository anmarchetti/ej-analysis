import { FC } from 'react';
import classNames from 'classnames';

import isBackend from 'frontend/utils/isBackend';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './SpecialRequestsAlerts.module.scss';

interface ISpecialRequestsAlertsProps {
    alerts: { description: string; message: string }[];
}

const SpecialRequestsAlerts: FC<ISpecialRequestsAlertsProps> = ({ alerts }: ISpecialRequestsAlertsProps) => {
    if (alerts.length < 1) return null;

    return (
        <div className={classNames(styles.alertsList, !alerts?.length && !isBackend() && 'd-none')}>
            {alerts.map(({ message, description }, i) => (
                <ErrorMessage
                    key={i + '_' + message}
                    message={description}
                    icon={<SvgWarningFilled />}
                    IfIsNotificationOrange
                    errorMessageClass={styles.errorMessage}
                />
            ))}
        </div>
    );
};

export default SpecialRequestsAlerts;
