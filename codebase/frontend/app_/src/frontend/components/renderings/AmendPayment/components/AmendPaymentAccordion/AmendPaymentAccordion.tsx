import { FunctionComponent, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { PaymentStep } from 'models/data/AmendInfo';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import TickCheck from 'frontend/components/common/TickCheck/TickCheck';
import { getMetaByAmendmentType } from 'frontend/components/renderings/AmendPayment/AmendPayment.utils';
import AmendPaymentMetaBlock from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock';
import AmendPaymentOptions from 'frontend/components/renderings/AmendPayment/components/AmendPaymentOptions/AmendPaymentOptions';
import PromoCodeDetails from 'frontend/components/renderings/AmendPayment/components/PromoCodeDetails/PromoCodeDetails';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import {
    gaClickAmendStepButton,
    gaClickAmendStepTile,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import AmendPaymentItemContainer from './components/AmendPaymentItemContainer/AmendPaymentItemContainer';
import {
    generateInitialStateFromSteps,
    getChangeSummaryComponent,
    getConfirmationTitle,
    TPaymentStepState,
} from './AmendPaymentAccordion.utils';

import styles from './AmendPaymentAccordion.module.scss';

export interface IAmendPaymentAccordionProps {
    fields: IPaymentPageFields;
    rendering: ISitecoreComponent['rendering'];
    steps?: PaymentStep[];
}
const defaultSteps = [PaymentStep.Entity, PaymentStep.Option, PaymentStep.Confirmation];

const AmendPaymentAccordion: FunctionComponent<IAmendPaymentAccordionProps> = ({
    fields,
    rendering,
    steps = defaultSteps,
}) => {
    const { isRefund, promocodeBreakdown, amendmentType } = useStore((stores: IHolidaysStores) => ({
        isRefund: stores.amendPaymentStore.isRefund,
        amendmentType: stores.amendPaymentStore.amendmentType,
        newSeatSelection: stores.amendSeatsStore.newSelection,
        promocodeBreakdown: stores.amendPaymentStore.promocodeBreakdown,
    }));

    const { pushTrackingEvent } = usePaymentTracking();

    useEffect(() => {
        setState(generateInitialStateFromSteps(steps));
    }, [steps]);

    const [state, setState] = useState<TPaymentStepState>(generateInitialStateFromSteps(steps));

    const isMobile = useMobileViewport();

    const onConfirmStep = (step: PaymentStep) => () => {
        const currentStepIndex = steps.findIndex(orderStep => orderStep === step);
        const isLast = currentStepIndex === steps.length - 1;

        if (isLast) {
            return;
        }

        const nextStep = steps[currentStepIndex + 1];

        if (isMobile) {
            const nextStepElement = document.getElementById(steps[currentStepIndex]);

            nextStepElement && scrollToElement(nextStepElement);
        }

        setState(prev => ({
            ...prev,
            [step]: { ...prev[step], isOpened: false, isChecked: true, isDisabled: false },
            [nextStep]: { ...prev[nextStep], isOpened: true, isDisabled: false },
        }));
        pushTrackingEvent(gaClickAmendStepButton(step));
    };

    const toggleOpen = (step: PaymentStep) => (newIsOpen: boolean) => {
        setState(prev => ({
            ...prev,
            [step]: { ...prev[step], isOpened: newIsOpen },
        }));
        pushTrackingEvent(gaClickAmendStepTile(step, newIsOpen));
    };

    const changeSummaryMeta = getMetaByAmendmentType(fields, amendmentType);

    const ChangeSummaryComponent = getChangeSummaryComponent(amendmentType);

    const isLastStepOpened = state[PaymentStep.Confirmation].isOpened;
    const confirmationTitle = getConfirmationTitle(fields, steps.length, isRefund)?.value;

    return (
        <div data-tid='amend-payment-accordion' className={styles.container}>
            <ExpandableItem
                title={fields.StepOneTitle.value}
                icon={<TickCheck {...state[PaymentStep.Entity]} />}
                onOpen={toggleOpen(PaymentStep.Entity)}
                {...state[PaymentStep.Entity]}
                id={PaymentStep.Entity}
                className={styles.expandableItem}
                titleClassName={styles.expandableItemTitle}
            >
                <AmendPaymentItemContainer
                    onContinue={onConfirmStep(PaymentStep.Entity)}
                    hideCta={state[PaymentStep.Entity]?.isChecked}
                    {...changeSummaryMeta}
                >
                    {!!ChangeSummaryComponent && <ChangeSummaryComponent fields={fields} rendering={rendering} />}
                    {!!promocodeBreakdown && (
                        <PromoCodeDetails promoCodeBreakDown={promocodeBreakdown} fields={fields} />
                    )}
                </AmendPaymentItemContainer>
            </ExpandableItem>

            {steps.includes(PaymentStep.Option) && (
                <ExpandableItem
                    title={isRefund ? fields.StepTwoRefundTitle.value : fields.StepTwoTitle.value}
                    icon={<TickCheck {...state[PaymentStep.Option]} />}
                    onOpen={toggleOpen(PaymentStep.Option)}
                    {...state[PaymentStep.Option]}
                    id={PaymentStep.Option}
                    className={styles.expandableItem}
                    titleClassName={styles.expandableItemTitle}
                >
                    <AmendPaymentItemContainer
                        onContinue={onConfirmStep(PaymentStep.Option)}
                        hideCta={state[PaymentStep.Option]?.isChecked}
                    >
                        <div className={styles.paymentOptions}>
                            <AmendPaymentOptions fields={fields} />
                        </div>
                    </AmendPaymentItemContainer>
                </ExpandableItem>
            )}

            <ExpandableItem
                title={confirmationTitle}
                icon={<TickCheck {...state[PaymentStep.Confirmation]} />}
                onOpen={toggleOpen(PaymentStep.Confirmation)}
                {...state[PaymentStep.Confirmation]}
                className={classNames({ [styles.bottomless]: isLastStepOpened }, styles.expandableItem)}
                titleClassName={styles.expandableItemTitle}
            >
                <AmendPaymentItemContainer onContinue={onConfirmStep(PaymentStep.Confirmation)} hideCta>
                    <AmendPaymentMetaBlock fields={fields} />
                </AmendPaymentItemContainer>
            </ExpandableItem>
        </div>
    );
};

export default observer(AmendPaymentAccordion);
