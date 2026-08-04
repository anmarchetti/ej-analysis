import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import {
    createMockStores,
    mockAmendDatesStore,
    mockPromoCodeBreakdown,
    mockRoomAndBoardRoomVariant,
    mockSelectedSeat,
    mockTransfersWithAmendmentCharges,
    mockValidatedFlights,
} from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { PaymentStep } from 'models/data/AmendInfo';
import { getMetaByAmendmentType } from 'frontend/components/renderings/AmendPayment/AmendPayment.utils';
import {
    gaClickAmendStepButton,
    gaClickAmendStepTile,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import AmendPaymentAccordion, { IAmendPaymentAccordionProps } from './AmendPaymentAccordion';
import {
    generateInitialStateFromSteps,
    getChangeSummaryComponent,
    getConfirmationTitle,
} from './AmendPaymentAccordion.utils';

expect.extend(toHaveNoViolations);

let mockProps: IAmendPaymentAccordionProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockExpandItemProps = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: ({ children, id, ...props }) => {
        mockExpandItemProps(props);

        return (
            <div data-tid='expand-item' id={id} onClick={() => props.onOpen(!props.isOpened)}>
                {children}
            </div>
        );
    },
}));

const mockEntityContainerProps = jest.fn();
jest.mock('./components/AmendPaymentItemContainer/AmendPaymentItemContainer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockEntityContainerProps(props);

        return (
            <div data-tid='entity-container' onClick={props.onContinue}>
                {children}
            </div>
        );
    },
}));

const mockTickProps = jest.fn();
jest.mock('frontend/components/common/TickCheck/TickCheck', () => ({
    __esModule: true,
    default: props => {
        mockTickProps(props);

        return <div data-tid='tick' />;
    },
}));

const mockAmendPromoCodeDetails = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/components/PromoCodeDetails/PromoCodeDetails', () => ({
    __esModule: true,
    default: props => {
        mockAmendPromoCodeDetails(props);

        return <div data-tid='promo-code-details' />;
    },
}));

const mockAmendPaymentMetaBlockProps = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock', () => ({
    __esModule: true,
    default: props => {
        mockAmendPaymentMetaBlockProps(props);

        return <div data-tid='payment-meta-block' />;
    },
}));

const mockAmendPaymentOptionsProps = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/components/AmendPaymentOptions/AmendPaymentOptions', () => ({
    __esModule: true,
    default: props => {
        mockAmendPaymentOptionsProps(props);

        return <div data-tid='amend-payment-options' />;
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    __esModule: true,
    scrollToElement: jest.fn(),
}));

jest.mock('./AmendPaymentAccordion.utils');
jest.mock('frontend/components/renderings/AmendPayment/AmendPayment.utils');

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

describe('<AmendPaymentAccordion />', () => {
    beforeAll(() => {
        jest.mocked(getConfirmationTitle).mockReturnValue(mockSitecoreField('StepThreeTitle'));
        jest.mocked(getMetaByAmendmentType).mockReturnValue({
            icon: mockSitecoreField(mockSitecoreImageField('icon')),
            title: mockSitecoreField('FlightsFlowIcon'),
        } as any);
        jest.mocked(getChangeSummaryComponent).mockReturnValue(() => <div data-tid='change-summary' />);
        jest.mocked(generateInitialStateFromSteps).mockReturnValue({
            [PaymentStep.Entity]: {
                isChecked: false,
                isDisabled: false,
                isOpened: true,
                index: 1,
            },
            [PaymentStep.Option]: {
                isChecked: false,
                isDisabled: true,
                isOpened: false,
                index: 2,
            },
            [PaymentStep.Confirmation]: {
                isChecked: false,
                isDisabled: true,
                isOpened: false,
                index: 3,
            },
        });
    });

    beforeEach(() => {
        mockStores = createMockStores({
            amendPaymentStore: {
                isRefund: false,
                isTimeToPay: false,
                promocodeBreakdown: mockPromoCodeBreakdown,
            },
            amendTransfersStore: {
                selectedTransfer: mockTransfersWithAmendmentCharges,
            },
            amendFlightsStore: {
                selectedFlight: mockValidatedFlights.transports[0],
            },
            amendRoomAndBoardStore: {
                chosenRoomVariant: mockRoomAndBoardRoomVariant,
            },
            amendDatesStore: mockAmendDatesStore,
            amendSeatsStore: {
                newSelection: [mockSelectedSeat],
            },
        });
        mockProps = {
            fields: {
                StepOneTitle: mockSitecoreField('StepOneTitle'),
                StepTwoTitle: mockSitecoreField('StepTwoTitle'),
                StepTwoRefundTitle: mockSitecoreField('StepTwoRefundTitle'),
            },
            rendering: 'rendering',
        } as IAmendPaymentAccordionProps;
    });

    it('Should render accordion component', () => {
        render(<AmendPaymentAccordion {...mockProps} />);

        expect(screen.getByTestId('amend-payment-accordion')).toBeInTheDocument();
        expect(screen.getByTestId('promo-code-details')).toBeInTheDocument();
        expect(screen.getByTestId('change-summary')).toBeInTheDocument();
        expect(screen.getAllByTestId('expand-item').length).toBe(3);
        expect(screen.getAllByTestId('entity-container').length).toBe(3);

        expect(mockAmendPromoCodeDetails).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                promoCodeBreakDown: mockPromoCodeBreakdown,
            }),
        );
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.StepOneTitle.value,
                icon: expect.anything(),
                onOpen: expect.any(Function),
                isOpened: true,
                isDisabled: false,
                isChecked: false,
            }),
        );
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.StepTwoTitle.value,
                icon: expect.anything(),
                onOpen: expect.any(Function),
                isOpened: false,
                isDisabled: true,
                isChecked: false,
            }),
        );
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'StepThreeTitle',
                icon: expect.anything(),
                onOpen: expect.any(Function),
                isOpened: false,
                isDisabled: true,
                isChecked: false,
            }),
        );
        expect(mockEntityContainerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                onContinue: expect.any(Function),
                hideCta: false,
                icon: mockSitecoreField(mockSitecoreImageField('icon')),
                title: mockSitecoreField('FlightsFlowIcon'),
            }),
        );
        expect(mockEntityContainerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                onContinue: expect.any(Function),
                hideCta: false,
            }),
        );
        expect(mockEntityContainerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                onContinue: expect.any(Function),
                hideCta: true,
            }),
        );

        expect(mockAmendPaymentMetaBlockProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
            }),
        );
    });

    it('should NOT render ChangeSummaryComponent when getChangeSummaryComponent returns null', () => {
        jest.mocked(getChangeSummaryComponent).mockReturnValue(() => null);

        render(<AmendPaymentAccordion {...mockProps} />);

        expect(screen.queryByTestId('change-summary')).not.toBeInTheDocument();
    });

    it('Should only render Entity and Confirmation step when only they are provided', () => {
        mockProps.steps = [PaymentStep.Entity, PaymentStep.Confirmation];
        render(<AmendPaymentAccordion {...mockProps} />);

        expect(screen.getAllByTestId('expand-item').length).toBe(2);
        expect(screen.getAllByTestId('entity-container').length).toBe(2);
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.StepOneTitle.value,
                icon: expect.anything(),
                onOpen: expect.any(Function),
                isOpened: true,
                isDisabled: false,
                isChecked: false,
            }),
        );
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'StepThreeTitle',
                icon: expect.anything(),
                onOpen: expect.any(Function),
                isOpened: false,
                isDisabled: true,
                isChecked: false,
            }),
        );

        expect(mockExpandItemProps).not.toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.StepTwoTitle.value,
            }),
        );
    });

    it('Should render refund title for step two when isRefund is true', () => {
        mockStores.amendPaymentStore.isRefund = true;
        render(<AmendPaymentAccordion {...mockProps} />);

        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.StepTwoRefundTitle.value,
            }),
        );
    });

    it('Should NOT render Promo Code Details component when promoCodeBreakDown is not exist', () => {
        mockStores.amendPaymentStore.promocodeBreakdown = undefined;
        render(<AmendPaymentAccordion {...mockProps} />);

        expect(screen.queryByTestId('promo-code-details')).not.toBeInTheDocument();
    });

    it('should apply bottomless className to last expand item when it is opened', async () => {
        render(<AmendPaymentAccordion {...mockProps} />);

        const paymentItem = screen.getAllByTestId('expand-item')[2];

        await userEvent.click(paymentItem);

        expect(mockExpandItemProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                title: 'StepThreeTitle',
                isOpened: true,
                className: 'bottomless expandableItem',
            }),
        );
    });

    describe('Handling onOpen function on ExpandableItem', () => {
        it('Should toggle open state by click on the Entity expand item', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItem] = screen.getAllByTestId('expand-item');

            await userEvent.click(entityItem);

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepOneTitle.value,
                    isOpened: false,
                    isDisabled: false,
                    isChecked: false,
                }),
            );
            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepTwoTitle.value,
                    isOpened: false,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'StepThreeTitle',
                    isOpened: false,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
        });

        it('Should toggle open state by click on the Option expand item', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [_, optionsItem] = screen.getAllByTestId('expand-item');

            await userEvent.click(optionsItem);

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepOneTitle.value,
                    isOpened: true,
                    isDisabled: false,
                    isChecked: false,
                }),
            );
            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepTwoTitle.value,
                    isOpened: true,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'StepThreeTitle',
                    isOpened: false,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
        });

        it('Should toggle open state by click on the Payment expand item', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [_, __, paymentItem] = screen.getAllByTestId('expand-item');

            await userEvent.click(paymentItem);

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepOneTitle.value,
                    isOpened: true,
                    isDisabled: false,
                    isChecked: false,
                }),
            );
            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepTwoTitle.value,
                    isOpened: false,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'StepThreeTitle',
                    isOpened: true,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
        });
    });

    describe('Handling onContinue click on EntityContainer', () => {
        it('Should make checked and closed entity item by click on item container, and open options expand item', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer] = screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepOneTitle.value,
                    isOpened: false,
                    isDisabled: false,
                    isChecked: true,
                }),
            );
            expect(mockEntityContainerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    hideCta: true,
                }),
            );

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepTwoTitle.value,
                    isOpened: true,
                    isDisabled: false,
                    isChecked: false,
                }),
            );
            expect(mockEntityContainerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    hideCta: false,
                }),
            );

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'StepThreeTitle',
                    isOpened: false,
                    isDisabled: true,
                    isChecked: false,
                }),
            );
        });

        it('Should make checked and closed options item by click on item container, and open payment expand item', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer, optionsItemContainer] = screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);
            await userEvent.click(optionsItemContainer);

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.StepTwoTitle.value,
                    isOpened: false,
                    isDisabled: false,
                    isChecked: true,
                }),
            );
            expect(mockEntityContainerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    hideCta: true,
                }),
            );

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'StepThreeTitle',
                    isOpened: true,
                    isDisabled: false,
                    isChecked: false,
                }),
            );
        });

        it('Should call scrollToElement when clicking continue button on mobile viewport', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer] = screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);

            expect(scrollToElement).toHaveBeenCalled();
        });

        it('Should NOT call scrollToElement when clicking continue button on desktop viewport', async () => {
            mockUseMobileViewport = false;
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer] = screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);

            expect(scrollToElement).not.toHaveBeenCalled();
        });

        it('Should NOT call scrollToElement on mobile when clicking continue on last step', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer, optionsItemContainer, paymentItemContainer] =
                screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);
            await userEvent.click(optionsItemContainer);
            await userEvent.click(paymentItemContainer);

            expect(scrollToElement).not.toHaveBeenCalled();
        });

        it('Should do nothing when click on payment item container', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer, optionsItemContainer, paymentItemContainer] =
                screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);
            await userEvent.click(optionsItemContainer);
            await userEvent.click(paymentItemContainer);

            expect(mockExpandItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'StepThreeTitle',
                    isOpened: true,
                    isDisabled: false,
                    isChecked: false,
                }),
            );
            expect(mockEntityContainerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    hideCta: false,
                }),
            );
        });
    });

    it('Should NOT render isAmendFlights component when not a isAMendFlights flow', () => {
        mockStores.amendPaymentStore.isFromAmendFlight = false;
        render(<AmendPaymentAccordion {...mockProps} />);

        expect(screen.queryByTestId('amend-flight-details')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentAccordion {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    describe('Tracking', () => {
        it('should call pushTrackingEvent with correct event params when new step Tile is clicked', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItem, optionsItem, paymentItem] = screen.getAllByTestId('expand-item');

            await userEvent.click(entityItem);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepTile(PaymentStep.Entity, false)); // it is opened by default
            await userEvent.click(entityItem);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepTile(PaymentStep.Entity, true));

            await userEvent.click(optionsItem);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepTile(PaymentStep.Option, true));
            await userEvent.click(optionsItem);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepTile(PaymentStep.Option, false));

            await userEvent.click(paymentItem);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepTile(PaymentStep.Confirmation, true));
            await userEvent.click(paymentItem);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepTile(PaymentStep.Confirmation, false));
        });

        it('should call pushTrackingEvent with correct event params when new step Button is clicked', async () => {
            render(<AmendPaymentAccordion {...mockProps} />);

            const [entityItemContainer, optionsItemContainer] = screen.getAllByTestId('entity-container');

            await userEvent.click(entityItemContainer);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepButton(PaymentStep.Entity));

            await userEvent.click(optionsItemContainer);
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickAmendStepButton(PaymentStep.Option));
        });
    });
});
