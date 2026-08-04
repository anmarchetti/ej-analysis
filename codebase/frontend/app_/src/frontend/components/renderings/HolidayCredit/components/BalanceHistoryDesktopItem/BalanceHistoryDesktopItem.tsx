import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
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

import styles from './BalanceHistoryDesktopItem.module.scss';

export type TBalanceHistoryDesktopItemProps = {
    creditItem: IBalanceHistoryItem;
    creditTypeTitle: string;
    currency: CurrencyCode | undefined;
    description: string;
    fields: IBalanceHistoryFields;
    handleExpand: () => void;
    isDisabled: boolean;
    isItemExpanded: boolean;
    status: BalanceOrderStatuses;
    LogoImage?: ISitecoreField<ISitecoreImage>;
    isRecentCredit?: boolean;
};

const BalanceHistoryDesktopItem: FC<TBalanceHistoryDesktopItemProps> = ({
    creditTypeTitle,
    currency,
    handleExpand,
    isDisabled,
    isItemExpanded,
    LogoImage,
    creditItem,
    fields,
    isRecentCredit,
    description,
    status,
}) => (
    <div
        className={classNames(styles.credit, {
            [styles.disabledCredit]: isDisabled,
            [styles.recentCredit]: isRecentCredit,
            [styles.expandedCredit]: isItemExpanded,
        })}
        data-tid='balance-history-item'
    >
        <div
            className={classNames({
                [styles.mainItem]: true,
                [styles.mainItemWithLogos]: fields.ShowLogos?.value,
            })}
            data-tid='balance-history-main-item'
        >
            <BalanceHistoryChip status={status} fields={fields} />

            <ExpirationDate expirationDate={creditItem.expires} fields={fields} />
            <CreditItemInfo
                showLogo={fields.ShowLogos?.value}
                logo={LogoImage}
                creditTypeName={creditTypeTitle}
                description={description}
                dataTid='balance-history-item'
                isRecentCredit={isRecentCredit}
            />
            <div className={classNames(styles.createdDate)} data-tid='balance-history-item-date'>
                {formatDateL10n(creditItem.createdAt, DATE_FORMATS.dateWithAbbrMonthName)}
            </div>
            <div />
            <div className={styles.balance} data-tid='balance-history-item-balance'>
                <FormattedMoney
                    className={styles.decimal}
                    amount={Math.abs(getBalanceOnStep(creditItem, 0))}
                    options={{ currency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                />
            </div>

            <ShowMoreButton
                dataTid='balance-history-item-button'
                onClick={handleExpand}
                aria-label={
                    isItemExpanded
                        ? fields.CollapseButtonScreenReaderLabel.value
                        : fields.ExpandButtonScreenReaderLabel.value
                }
                isChevronUp={isItemExpanded}
            />
        </div>
        {isItemExpanded && (
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
    </div>
);
export default BalanceHistoryDesktopItem;
