import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { PaymentStep } from 'models/data/AmendInfo';
import { AmendmentType } from 'models/data/IBookingInfo';
import AmendDatesDetails from 'frontend/components/renderings/AmendPayment/components/AmendDatesDetails/AmendDatesDetails';
import AmendFlightsDetails from 'frontend/components/renderings/AmendPayment/components/AmendFlightsDetails/AmendFlightsDetails';
import AmendHotelDetails from 'frontend/components/renderings/AmendPayment/components/AmendHotelDetails/AmendHotelDetails';
import AmendPaymentRoomAndBoardDetails from 'frontend/components/renderings/AmendPayment/components/AmendPaymentRoomAndBoardDetails/AmendPaymentRoomAndBoardDetails';
import AmendTransferDetails from 'frontend/components/renderings/AmendPayment/components/AmendPaymentTransferDetails/AmendPaymentTransferDetails';
import AmendSeatsDetails from 'frontend/components/renderings/AmendPayment/components/AmendSeatsDetails/AmendSeatsDetails';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import {
    generateInitialStateFromSteps,
    getChangeSummaryComponent,
    getConfirmationTitle,
} from './AmendPaymentAccordion.utils';

describe('AmendPaymentAccordion.utils', () => {
    const fields: IPaymentPageFields = {
        StepOneTitle: mockSitecoreField('StepOneTitle'),
        StepTwoTitle: mockSitecoreField('StepTwoTitle'),
        StepThreeTitle: mockSitecoreField('StepThreeTitle'),
        StepTwoRefundTitle: mockSitecoreField('StepTwoRefundTitle'),
        StepThreeRefundTitle: mockSitecoreField('StepThreeRefundTitle'),
        TransfersFlowIcon: mockSitecoreField(mockSitecoreImageField('TransfersFlowIcon')),
        FlightsFlowIcon: mockSitecoreField(mockSitecoreImageField('FlightsFlowIcon')),
        DatesFlowIcon: mockSitecoreField(mockSitecoreImageField('DatesFlowIcon')),
        RoomAndBoardFlowIcon: mockSitecoreField(mockSitecoreImageField('RoomAndBoardFlowIcon')),
        TransfersFlowTitle: mockSitecoreField('TransfersFlowTitle'),
        FlightsFlowTitle: mockSitecoreField('FlightsFlowTitle'),
        DatesFlowTitle: mockSitecoreField('DatesFlowTitle'),
        RoomAndBoardFlowTitle: mockSitecoreField('RoomAndBoardFlowTitle'),
        SeatsFlowTitle: mockSitecoreField('SeatsFlowTitle'),
        SeatsFlowIcon: mockSitecoreField(mockSitecoreImageField('SeatsFlowTitle')),
    } as IPaymentPageFields;

    describe('getConfirmationTitle', () => {
        it('Should return correct title when only two steps', () => {
            const result = getConfirmationTitle(fields, 2, false);

            expect(result).toStrictEqual(fields.StepTwoConfirmTitle);
        });

        it('Should return correct title for refund', () => {
            const result = getConfirmationTitle(fields, 3, true);

            expect(result).toStrictEqual(fields.StepThreeRefundTitle);
        });

        it('Should return title for payable amount', () => {
            const result = getConfirmationTitle(fields, 3, false);

            expect(result).toStrictEqual(fields.StepThreeTitle);
        });
    });

    describe('generateInitialStateFromSteps', () => {
        it('Should generate initial state from steps with three steps', () => {
            const result = generateInitialStateFromSteps([
                PaymentStep.Entity,
                PaymentStep.Option,
                PaymentStep.Confirmation,
            ]);

            expect(result).toStrictEqual({
                [PaymentStep.Entity]: { isOpened: true, isDisabled: false, isChecked: false, index: 1 },
                [PaymentStep.Option]: { isOpened: false, isDisabled: true, isChecked: false, index: 2 },
                [PaymentStep.Confirmation]: { isOpened: false, isDisabled: true, isChecked: false, index: 3 },
            });
        });

        it('Should generate initial state from steps with two steps', () => {
            const result = generateInitialStateFromSteps([PaymentStep.Entity, PaymentStep.Option]);

            expect(result).toStrictEqual({
                [PaymentStep.Entity]: { isOpened: true, isDisabled: false, isChecked: false, index: 1 },
                [PaymentStep.Option]: { isOpened: false, isDisabled: true, isChecked: false, index: 2 },
            });
        });
    });

    describe('getChangeSummaryComponent', () => {
        it('Should return AmendFlightsDetails for AmendmentType.Flight', () => {
            const result = getChangeSummaryComponent(AmendmentType.Flight);

            expect(result).toStrictEqual(AmendFlightsDetails);
        });

        it('Should return AmendTransferDetails for AmendmentType.Transfer', () => {
            const result = getChangeSummaryComponent(AmendmentType.Transfer);

            expect(result).toStrictEqual(AmendTransferDetails);
        });

        it('Should return AmendSeatsDetails for AmendmentType.Seats', () => {
            const result = getChangeSummaryComponent(AmendmentType.Seats);

            expect(result).toStrictEqual(AmendSeatsDetails);
        });

        it('Should return AmendDatesDetails for AmendmentType.Dates', () => {
            const result = getChangeSummaryComponent(AmendmentType.Dates);

            expect(result).toStrictEqual(AmendDatesDetails);
        });

        it('Should return AmendPaymentRoomAndBoardDetails for AmendmentType.RoomAndBoard', () => {
            const result = getChangeSummaryComponent(AmendmentType.RoomAndBoard);

            expect(result).toStrictEqual(AmendPaymentRoomAndBoardDetails);
        });

        it('Should return AmendHotelDetails for AmendmentType.Hotel', () => {
            const result = getChangeSummaryComponent(AmendmentType.Hotel);

            expect(result).toStrictEqual(AmendHotelDetails);
        });

        it('should return null when no amendment type', () => {
            const result = getChangeSummaryComponent(null);

            expect(result).toBe(null);
        });
    });
});
