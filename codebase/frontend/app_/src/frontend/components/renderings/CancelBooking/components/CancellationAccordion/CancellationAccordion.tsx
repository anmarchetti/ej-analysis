import React, { Dispatch, FC, SetStateAction } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import HolidaySummary from 'frontend/components/common/HolidaySummary/HolidaySummary';
import { SummaryInfo } from 'frontend/components/common/HolidaySummary/HolidaySummary.utils';
import TickCheck from 'frontend/components/common/TickCheck/TickCheck';
import AmendPaymentItemContainer from 'frontend/components/renderings/AmendPayment/components/AmendPaymentAccordion/components/AmendPaymentItemContainer/AmendPaymentItemContainer';
import {
    DEFAULT_STEPS,
    RefundStep,
    TRefundStepState,
} from 'frontend/components/renderings/CancelBooking/CancelBooking.utils';
import CancellationConfirmation, {
    ICancellationConfirmationFields,
} from 'frontend/components/renderings/CancelBooking/components/CancellationConfirmation/CancellationConfirmation';
import RefundOptions from 'frontend/components/renderings/CancelBooking/components/RefundOptions/RefundOptions';
import RefundOptionsOTUC, {
    IRefundOptionsOTUCFields,
} from 'frontend/components/renderings/CancelBooking/components/RefundOptionsOTUC/RefundOptionsOTUC';

import styles from './CancellationAccordion.module.scss';

export interface ICancellationAccordionFields
    extends ICancellationConfirmationFields,
        ILuggageInfoFields,
        IRefundOptionsOTUCFields {
    StepOneTitle: ISitecoreField<string>;
    StepThreeTitle: ISitecoreField<string>;
    StepTwoNoRefundTitle: ISitecoreField<string>;
    StepTwoTitle: ISitecoreField<string>;
}

export type TCancellationAccordionProps = {
    booking: Nullable<IBookingInfo>;
    fields: ICancellationAccordionFields;
    setStepsState: Dispatch<SetStateAction<TRefundStepState>>;
    stepsState: TRefundStepState;
};

export const CancellationAccordion: FC<TCancellationAccordionProps> = ({
    fields,
    booking,
    setStepsState,
    stepsState,
}) => {
    const { isOneTimeUseCreditEnabled, isCancellationSummaryIsLoading, isTradePortal, cancellationSummary } = useStore(
        (stores: TStores) => ({
            isOneTimeUseCreditEnabled: isHolidayStore(stores)
                ? stores.holidayCreditStore.isOneTimeUseCreditEnabled
                : false,
            isCancellationSummaryIsLoading: stores.holidayCreditStore.isCancellationSummaryIsLoading,
            isTradePortal: stores.layoutStore.isTradePortal,
            cancellationSummary: stores.holidayCreditStore.cancellationSummary,
        }),
    );

    const isMobile = useMobileViewport();

    const onConfirmStep = (step: RefundStep) => () => {
        const currentStepIndex = DEFAULT_STEPS.findIndex(orderStep => orderStep === step);
        const isLast = currentStepIndex === DEFAULT_STEPS.length - 1;

        if (isLast) {
            return;
        }

        const nextStep = DEFAULT_STEPS[currentStepIndex + 1];

        if (isMobile) {
            const nextStepElement = document.getElementById(DEFAULT_STEPS[currentStepIndex]);
            nextStepElement && scrollToElement(nextStepElement);
        }

        setStepsState(prev => ({
            ...prev,
            [step]: { ...prev[step], isOpened: false, isChecked: true, isDisabled: false },
            [nextStep]: { ...prev[nextStep], isOpened: true, isDisabled: false },
        }));
    };

    const toggleOpen = (step: RefundStep) => state => {
        setStepsState(prev => ({
            ...prev,
            [step]: { ...prev[step], isOpened: state },
        }));
    };

    const summaryStepState = stepsState[RefundStep.HolidaySummary];
    const refundsStepState = stepsState[RefundStep.RefundOptions];
    const confirmationStepState = stepsState[RefundStep.Confirmation];

    return (
        <div data-tid='cancellation-accordion' className={styles.container}>
            <ExpandableItem
                title={fields.StepOneTitle.value}
                icon={
                    <TickCheck
                        isChecked={summaryStepState.isChecked}
                        isDisabled={summaryStepState.isDisabled}
                        index={1}
                    />
                }
                onOpen={toggleOpen(RefundStep.HolidaySummary)}
                {...summaryStepState}
                id={RefundStep.HolidaySummary}
                className={styles.expandableItem}
                titleClassName={styles.expandableItemTitle}
                isLoading={isCancellationSummaryIsLoading}
            >
                {!!booking && (
                    <AmendPaymentItemContainer
                        onContinue={onConfirmStep(RefundStep.HolidaySummary)}
                        hideCta={summaryStepState?.isChecked}
                        className={styles.itemContainer}
                    >
                        <HolidaySummary
                            booking={booking}
                            summaryInfoOrder={[
                                SummaryInfo.Flight,
                                SummaryInfo.AccommodationAndBoard,
                                SummaryInfo.LuggageAndTransfer,
                                SummaryInfo.PassengerDetails,
                                SummaryInfo.FreeKids,
                                SummaryInfo.AirportParking,
                            ]}
                            showStayDuration
                            luggageInfoFields={fields}
                        />
                    </AmendPaymentItemContainer>
                )}
            </ExpandableItem>

            <ExpandableItem
                title={
                    cancellationSummary?.refunds.length === 0
                        ? fields.StepTwoNoRefundTitle.value || fields.StepTwoTitle.value
                        : fields.StepTwoTitle.value
                }
                icon={
                    <TickCheck
                        isChecked={refundsStepState.isChecked}
                        isDisabled={refundsStepState.isDisabled}
                        index={2}
                    />
                }
                onOpen={toggleOpen(RefundStep.RefundOptions)}
                {...refundsStepState}
                id={RefundStep.RefundOptions}
                className={styles.expandableItem}
                titleClassName={styles.expandableItemTitle}
                isLoading={isCancellationSummaryIsLoading}
            >
                {!!booking && (
                    <AmendPaymentItemContainer
                        onContinue={onConfirmStep(RefundStep.RefundOptions)}
                        hideCta={refundsStepState?.isChecked}
                        className={styles.itemContainer}
                    >
                        {isOneTimeUseCreditEnabled || isTradePortal ? (
                            <RefundOptionsOTUC fields={fields} />
                        ) : (
                            <RefundOptions
                                refundData={booking.refund}
                                refundOptions={fields.Children}
                                currency={booking.paymentInfo.currency}
                            />
                        )}
                    </AmendPaymentItemContainer>
                )}
            </ExpandableItem>

            <ExpandableItem
                title={fields.StepThreeTitle.value}
                icon={
                    <TickCheck
                        isChecked={confirmationStepState.isChecked}
                        isDisabled={confirmationStepState.isDisabled}
                        index={3}
                    />
                }
                onOpen={toggleOpen(RefundStep.Confirmation)}
                {...confirmationStepState}
                className={classNames(confirmationStepState.isOpened && styles.bottomless, styles.expandableItem)}
                titleClassName={styles.expandableItemTitle}
                isLoading={isCancellationSummaryIsLoading}
            >
                <AmendPaymentItemContainer
                    onContinue={onConfirmStep(RefundStep.Confirmation)}
                    hideCta
                    className={styles.itemContainer}
                >
                    <CancellationConfirmation fields={fields} />
                </AmendPaymentItemContainer>
            </ExpandableItem>
        </div>
    );
};

export default observer(CancellationAccordion);
