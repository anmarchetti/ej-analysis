import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import { IBookingRefund } from 'models/data/IBookingInfo';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { CreditType } from 'models/enum/CreditType';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PaymentBaseOption from 'frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption';
import PaymentOptionBreakdown from 'frontend/components/common/PriceOptions/PaymentOptionBreakdown/PaymentOptionBreakdown';
import RefundOptionPopup from 'frontend/components/renderings/CancelBooking/components/RefundOptionPopup/RefundOptionPopup';

import styles from './RefundOptions.module.scss';

export interface IExplanationPopup {
    IsLinkVisible: ISitecoreField<boolean>;
    LinkText: ISitecoreField<string>;
    PopupUniqueId: ISitecoreField<string>;
    TextPopup: ISitecoreField<string>;
    TitlePopup: ISitecoreField<string>;
}

export interface IRefundOption {
    CashLabel: ISitecoreField<string>;
    CreditLabel: ISitecoreField<string>;
    OptionTitle: ISitecoreField<string>;
    Popups: ISitecoreChildren<IExplanationPopup>[];
    RefundUniqueId: ISitecoreField<string>;
    TotalLabel: ISitecoreField<string>;
}

export type TRefundOptionsProps = {
    currency: CurrencyCode;
    refundData: IBookingRefund;
    refundOptions: ISitecoreChildren<IRefundOption>[];
};

export const RefundOptions: FC<TRefundOptionsProps> = ({ refundOptions, refundData, currency }) => {
    const { selectedRefundType, setSelectedRefundType } = useStore((stores: IHolidaysStores) => ({
        selectedRefundType: stores.holidayCreditStore.selectedRefundType,
        setSelectedRefundType: stores.holidayCreditStore.setSelectedRefundType,
    }));

    if (!refundOptions.length) return null;

    return (
        <div className={styles.sizeContainer} data-tid='refund-options'>
            <div className={styles.container}>
                {refundOptions.map(({ fields }) => {
                    const { RefundUniqueId, Popups, OptionTitle, TotalLabel, CreditLabel, CashLabel } = fields;
                    const refundType = CreditType[RefundUniqueId.value];
                    const refund = refundData[refundType];

                    if (!refund?.isEligible) return null;

                    const totalRefund = getTotalBookingRefund(refundType === CreditType.Credit, refundData);
                    const popup = Popups?.find(({ fields }) => fields?.PopupUniqueId?.value === RefundUniqueId.value);

                    return (
                        <PaymentBaseOption
                            key={refundType}
                            checkboxId={`refund-option-${refundType}`}
                            title={OptionTitle.value}
                            isSelected={selectedRefundType === refundType}
                            onChange={(): void => setSelectedRefundType(refundType)}
                            price={totalRefund}
                            priceDescription={TotalLabel.value}
                            currency={currency}
                        >
                            <div className={styles.breakdowns}>
                                {refund.credit > 0 && (
                                    <PaymentOptionBreakdown
                                        label={CreditLabel.value}
                                        value={refund.credit}
                                        className={styles.option}
                                        currency={currency}
                                    />
                                )}
                                {refund.cash > 0 && (
                                    <PaymentOptionBreakdown
                                        label={CashLabel.value}
                                        value={refund.cash}
                                        className={styles.option}
                                        currency={currency}
                                    />
                                )}

                                {popup && <RefundOptionPopup fields={popup.fields} />}
                            </div>
                        </PaymentBaseOption>
                    );
                })}
            </div>
        </div>
    );
};

export default observer(RefundOptions);
