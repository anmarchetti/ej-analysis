import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IBalanceHistoryFields, IBalanceHistoryItem } from 'models/data/IBalanceHistory';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import FormattedMoney, { MIN_FRACTION_DIGITS } from 'frontend/components/common/FormattedMoney/FormattedMoney';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import BalanceHistoryChip, {
    BalanceOrderStatuses,
} from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip';
import BalanceHistorySubItem from 'frontend/components/renderings/HolidayCredit/components/BalanceHistorySubItem/BalanceHistorySubItem';
import CreditItemInfo from 'frontend/components/renderings/HolidayCredit/components/CreditItemInfo/CreditItemInfo';
import ExpirationDate from 'frontend/components/renderings/HolidayCredit/components/ExpirationDate/ExpirationDate';
import { getBalanceOnStep } from 'frontend/components/renderings/HolidayCredit/utils';

import styles from './BalanceHistoryMobileItem.module.scss';

export type TBalanceHistoryMobileItemProps = {
    creditItem: IBalanceHistoryItem;
    creditTypeTitle: string;
    currency: CurrencyCode | undefined;
    description: string;
    fields: IBalanceHistoryFields;
    handleExpand: () => void;
    isDisabled: boolean;
    isDrawerExpanded: boolean;
    isItemExpanded: boolean;
    status: BalanceOrderStatuses;
    LogoImage?: ISitecoreField<ISitecoreImage>;
    isInsideDrawer?: boolean;
    isRecentCredit?: boolean;
    withoutBorderTop?: boolean;
};

const BalanceHistoryMobileItem: FC<TBalanceHistoryMobileItemProps> = ({
    creditTypeTitle,
    currency,
    handleExpand,
    isDisabled,
    isItemExpanded,
    LogoImage,
    creditItem,
    fields,
    isRecentCredit,
    withoutBorderTop,
    isInsideDrawer,
    isDrawerExpanded,
    status,
    description,
}) => {
    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    return (
        <button
            className={classNames(styles.credit, {
                [styles.disabledCredit]: isDisabled,
                [styles.recentCredit]: isRecentCredit,
                [styles.withoutBorderTop]: withoutBorderTop,
                [styles.insideDrawer]: isInsideDrawer,
                [styles.expandedCredit]: isItemExpanded,
            })}
            data-tid='balance-history-mobile-item'
            onClick={isMoreThenMobileViewport ? undefined : handleExpand}
        >
            <div className={styles.mainItem}>
                <div className={styles.cardHead}>
                    {status && <BalanceHistoryChip status={status} fields={fields} />}
                    <div className={styles.balanceContainer}>
                        <div className={styles.balance} data-tid='balance-history-mobile-item-balance'>
                            <FormattedMoney
                                className={styles.decimal}
                                amount={Math.abs(getBalanceOnStep(creditItem, 0))}
                                options={{ currency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                            />
                        </div>
                        {!isDrawerExpanded && (
                            <ShowMoreButton
                                dataTid='balance-history-mobile-item-button'
                                onClick={handleExpand}
                                aria-label={
                                    isItemExpanded
                                        ? fields.CollapseButtonScreenReaderLabel.value
                                        : fields.ExpandButtonScreenReaderLabel.value
                                }
                                isChevronUp={isMoreThenMobileViewport && isItemExpanded}
                            />
                        )}
                    </div>

                    <ExpirationDate expirationDate={creditItem.expires} fields={fields} />
                </div>

                <div className={styles.creditInfo} data-tid='balance-history-mobile-item-logo-and-type'>
                    <CreditItemInfo
                        creditTypeName={creditTypeTitle}
                        description={description}
                        dataTid='balance-history-mobile-item'
                        showLogo={fields.ShowLogos?.value}
                        logo={LogoImage}
                    />
                    <span className={styles.issuedOn}>
                        <Text field={fields.IssuedOnLabel} component='span' />
                        <span>{formatDateL10n(creditItem.createdAt, DATE_FORMATS.dateWithAbbrMonthName)}</span>
                    </span>
                </div>
            </div>

            {(isItemExpanded || isDrawerExpanded) && (
                <div className={styles.details}>
                    {creditItem.redemptions.map((redemption, i) => (
                        <BalanceHistorySubItem
                            key={redemption.id}
                            currency={currency}
                            metadata={redemption.metadata}
                            order={redemption.order}
                            balance={getBalanceOnStep(creditItem, i)}
                            fields={fields}
                            creditTypeTitle={creditTypeTitle}
                        />
                    ))}
                    <BalanceHistorySubItem
                        currency={currency}
                        metadata={creditItem.metadata}
                        order={creditItem.order}
                        fields={fields}
                        creditTypeTitle={creditTypeTitle}
                    />
                </div>
            )}
        </button>
    );
};

export default BalanceHistoryMobileItem;
