import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IBalanceHistoryFields } from 'models/data/IBalanceHistory';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgClockFilled from 'frontend/components/icons-new/ClockFilled';
import SvgSuccessFilled from 'frontend/components/icons-new/SuccessFilled';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './BalanceHistoryChip.module.scss';

export type TBalanceHistoryChipProps = {
    fields: IBalanceHistoryFields;
    status: BalanceOrderStatuses;
};

export enum BalanceOrderStatuses {
    ExpireSoon = 'expireSoon',
    Active = 'active',
    Expired = 'expired',
    Used = 'used',
}

type TStatusMapper = {
    [key in BalanceOrderStatuses]: {
        className: string;
        icon: React.FC<React.SVGProps<SVGSVGElement>>;
        labelField: ISitecoreField<string>;
        iconClassName?: string;
    };
};

const BalanceHistoryChip: React.FC<TBalanceHistoryChipProps> = ({ status, fields }) => {
    const statusMapper: TStatusMapper = {
        [BalanceOrderStatuses.ExpireSoon]: {
            className: styles.expireSoonCredit,
            labelField: fields.ExpireStateExpiresSoon,
            icon: SvgClockFilled,
        },
        [BalanceOrderStatuses.Active]: {
            className: styles.activeCredit,
            labelField: fields.ExpireStateActive,
            icon: SvgSuccessFilled,
        },
        [BalanceOrderStatuses.Expired]: {
            className: styles.expiredCredit,
            labelField: fields.ExpireStateExpired,
            icon: SvgWarningFilled,
            iconClassName: styles.expiredIcon,
        },
        [BalanceOrderStatuses.Used]: {
            className: styles.usedCredit,
            labelField: fields.ExpireStateUsed,
            icon: SvgSuccessFilled,
        },
    };

    const Icon = statusMapper[status].icon;

    return (
        <div className={classNames(styles.status, statusMapper[status].className)}>
            <Icon className={statusMapper[status]?.iconClassName} />
            <Text field={statusMapper[status].labelField} tag='span' />
        </div>
    );
};

export default BalanceHistoryChip;
