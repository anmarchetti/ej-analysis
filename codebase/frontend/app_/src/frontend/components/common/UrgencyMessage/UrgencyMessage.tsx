import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import Pill from 'frontend/components/common/Pills/Pill/Pill';
import TimeRunningOut from 'frontend/components/icons-new/TimeRunningOut';

import styles from './UrgencyMessage.module.scss';

export interface IUrgencyMessageProps {
    message: string;
    className?: string;
    tooltip?: string;
    tooltipClass?: string;
}

const UrgencyMessage: FunctionComponent<IUrgencyMessageProps> = ({ message, className, tooltip, tooltipClass }) => {
    if (!message) return null;

    return (
        <Pill
            ellipsis
            contentClass={classNames(styles.urgencyMessageWrapper, styles.priority, className)}
            icon={<TimeRunningOut />}
            title={message}
            text={tooltip}
            tooltipClass={tooltipClass}
        />
    );
};

export default observer(UrgencyMessage);
