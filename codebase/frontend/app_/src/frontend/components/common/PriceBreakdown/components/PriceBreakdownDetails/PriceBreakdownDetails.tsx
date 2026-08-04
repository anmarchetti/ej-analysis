import { FunctionComponent, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ChangeFeeBreakdown from 'frontend/components/common/PriceBreakdown/components/ChangeFeeBreakdown/ChangeFeeBreakdown';
import PriceBreakdownItem, {
    IPriceBreakdownItem,
} from 'frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem';
import { IPriceBreakdownFields } from 'frontend/components/common/PriceBreakdown/PriceBreakdown';
import { DATA_TID_DETAILS as DATA_TID } from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';

import styles from './PriceBreakdownDetails.module.scss';

export interface IPriceBreakdownDetailsProps {
    currency: CurrencyCode;
    fields: IPriceBreakdownFields;
    totalPrice: number | undefined;
    feeChargePrice?: number;
    feesPerPersons?: IFeePerPerson[];

    holidayCredit?: number;
    previousBalance?: number;
    priceBreakdownItems?: IPriceBreakdownItem[];
    totalCostOfChangeField?: ISitecoreField<string>;
    touristTaxSummaryNode?: ReactNode;
}

const PriceBreakdownDetails: FunctionComponent<IPriceBreakdownDetailsProps> = ({
    feeChargePrice,
    totalPrice,
    fields,
    feesPerPersons,
    previousBalance,
    priceBreakdownItems,
    holidayCredit,
    currency,
    totalCostOfChangeField,
    touristTaxSummaryNode,
}) => {
    const { isCancelBookingPage } = useStore(({ layoutStore }: IHolidaysStores) => ({
        isCancelBookingPage: layoutStore.isCancelBookingPage,
    }));

    const isTotalPriceExists = totalPrice !== undefined;
    const { PreviousBalanceLabel, ChangeFeeTitle, HolidayCredit } = fields;

    const shouldShowTotalCostOfChange = isCancelBookingPage ? isTotalPriceExists : !!totalPrice;

    if (
        !shouldShowTotalCostOfChange &&
        !feeChargePrice &&
        !holidayCredit &&
        !previousBalance &&
        !priceBreakdownItems?.length
    ) {
        return null;
    }

    return (
        <>
            <div className={styles.priceBreakdownDetails} data-tid={DATA_TID}>
                {!!previousBalance && (
                    <PriceBreakdownItem
                        breakdownTitle={PreviousBalanceLabel?.value ?? ''}
                        amount={previousBalance}
                        className={styles.balanceRow}
                        uniqueKey='prev-balance'
                        currency={currency}
                    />
                )}
                {priceBreakdownItems?.map((breakdown, index) => (
                    <PriceBreakdownItem
                        {...breakdown}
                        key={`item-${breakdown.breakdownTitle}`}
                        uniqueKey={breakdown.uniqueKey || `item-${index}`}
                        currency={currency}
                    />
                ))}
                {!!feeChargePrice && (
                    <PriceBreakdownItem
                        breakdownTitle={ChangeFeeTitle?.value ?? ''}
                        amount={feeChargePrice}
                        uniqueKey='fee'
                        currency={currency}
                    >
                        {feesPerPersons?.map(feePerson => (
                            <ChangeFeeBreakdown key={`fee-person-${feePerson.feesCount}`} {...feePerson} />
                        ))}
                    </PriceBreakdownItem>
                )}
                {!!holidayCredit && (
                    <PriceBreakdownItem
                        breakdownTitle={HolidayCredit?.value ?? ''}
                        amount={-holidayCredit}
                        uniqueKey='holiday-credit'
                        className={styles.creditRow}
                        currency={currency}
                    />
                )}
                {shouldShowTotalCostOfChange && (
                    <PriceBreakdownItem
                        breakdownTitle={totalCostOfChangeField?.value ?? ''}
                        amount={totalPrice || 0}
                        className={styles.totalRow}
                        uniqueKey='total'
                        currency={currency}
                    />
                )}
            </div>
            {!!touristTaxSummaryNode && (
                <div className={classNames(styles.priceBreakdownDetails, styles.touristTaxSummary)}>
                    {touristTaxSummaryNode}
                </div>
            )}
        </>
    );
};

export default observer(PriceBreakdownDetails);
