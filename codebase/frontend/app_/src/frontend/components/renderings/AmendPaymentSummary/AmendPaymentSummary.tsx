import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmendPaymentTotalBlock from 'frontend/components/common/Amend/AmendPaymentTotalBlock/AmendPaymentTotalBlock';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import PriceBreakdown from 'frontend/components/common/PriceBreakdown/PriceBreakdown';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import AmendmentViewBookingCost from 'frontend/components/renderings/AmendPaymentSummary/components/AmendmentViewBookingCost/AmendmentViewBookingCost';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import AmendPaymentSummaryDetailsWrapper from './components/AmendPaymentSummaryDetailsWrapper/AmendPaymentSummaryDetailsWrapper';

import styles from './AmendPaymentSummary.module.scss';

type TAmendPaymentSummaryProps = ISitecoreComponent<IPaymentPageFields>;

const AmendPaymentSummary: FC<TAmendPaymentSummaryProps> = ({ fields, rendering }) => {
    const { newSeatsSelection, amountToPay, redirectToTradePortalFindBookingPage, isPaying, getPhrase, currency } =
        useStore((stores: TStores) => ({
            amountToPay: stores.amendPaymentStore.amountToPay,
            newSeatsSelection: stores.amendSeatsStore.newSelection,
            isPaying: stores.amendPaymentStore.isPaying,
            getPhrase: stores.layoutStore.getPhrase,
            currency: stores.marketStore.currency,
            ...(isTradeStore(stores) && {
                redirectToTradePortalFindBookingPage: stores.routerStore.redirectToTradePortalFindBookingPage,
            }),
        }));

    if (redirectToTradePortalFindBookingPage && !newSeatsSelection) {
        redirectToTradePortalFindBookingPage();
    }

    if (!fields) {
        return null;
    }

    const priceBreakdown = [
        {
            breakdownTitle: fields.SeatsChange?.value ?? '',
            amount: amountToPay,
            uniqueKey: 'change',
            tooltipText: fields.ChangeTooltip?.value,
        },
    ];

    return (
        <ComponentWrapper>
            <div className={styles.paymentContainer}>
                <div className={styles.leftColumn}>
                    <AmendPaymentSummaryDetailsWrapper fields={fields} rendering={rendering} />

                    <div className={styles.summary}>
                        <AmendPaymentTotalBlock
                            title={fields.ConfirmChangesLabel?.value}
                            confirmLabel={fields.ConfirmButtonLabel?.value}
                        >
                            <AmendmentViewBookingCost fields={fields} />
                        </AmendPaymentTotalBlock>
                    </div>
                </div>
                <div className={styles.rightColumn}>
                    <PriceBreakdown
                        totalPrice={amountToPay}
                        fields={fields}
                        priceBreakdownItems={priceBreakdown}
                        isTradePortal
                        currency={currency}
                    />
                </div>
            </div>

            {isPaying && (
                <OverlaySpinner
                    header={getPhrase(SitecoreDictionary.PaymentTitlesSpinnerHeader)}
                    description={getPhrase(SitecoreDictionary.PaymentTitlesSpinnerDescription)}
                />
            )}
        </ComponentWrapper>
    );
};

export default observer(AmendPaymentSummary);
