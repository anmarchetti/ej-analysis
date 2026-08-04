import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { DATE_FORMATS } from 'code/dates';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IBalanceHistoryFields } from 'models/data/IBalanceHistory';
import { getExpireSoonLabel, isCreditExpired } from 'frontend/components/renderings/HolidayCredit/utils';

import styles from './ExpirationDate.module.scss';

type TExpirationDateProps = {
    expirationDate: string;
    fields: IBalanceHistoryFields;
};

const ExpirationDate: FC<TExpirationDateProps> = ({ expirationDate, fields }) => {
    const getPhrase = useStore((stores: IHolidaysStores) => stores.layoutStore.getPhrase);
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const expireSoonLabel = getExpireSoonLabel(expirationDate, fields, getPhrase, !isMoreThenTabletViewport);
    const isExpired = isCreditExpired(expirationDate);

    return (
        <div className={styles.expireDate} data-tid='balance-history-mobile-item-expire-date'>
            <div className={styles.date}>
                {!isMoreThenTabletViewport && (
                    <>
                        {isExpired ? (
                            <Text field={fields.ExpiredOnLabel} component='span' />
                        ) : (
                            <Text field={fields.ExpiresOnLabel} component='span' />
                        )}
                    </>
                )}
                <span>{formatDateL10n(expirationDate, DATE_FORMATS.dateWithAbbrMonthName)}</span>
            </div>
            <span className={styles.expireSoon}>{expireSoonLabel}</span>
        </div>
    );
};

export default ExpirationDate;
