import { render, screen } from '@testing-library/react';

import { mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { AmendmentType } from 'models/data/IBookingInfo';
import {
    getPopupContent,
    getPopupSubtitle,
} from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/SuccessfulAmendmentPopup.utils';
import { ISuccessfulAmendmentPopupFields } from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup';

// Mocking Tokenizer function (if necessary)
jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: jest.fn((value, token, replacement) => value.replace(token, replacement)),
    },
}));

jest.mock(
    'frontend/components/renderings/SuccessfulAmendmentPopup/components/FlightPopupContent/FlightPopupContent',
    () => jest.fn(() => <div data-tid='flights-content' />),
);
jest.mock(
    'frontend/components/renderings/SuccessfulAmendmentPopup/components/DatesPopupContent/DatesPopupContent',
    () => jest.fn(() => <div data-tid='dates-content' />),
);
jest.mock(
    'frontend/components/renderings/SuccessfulAmendmentPopup/components/SeatsPopupContent/SeatsPopupContent',
    () => jest.fn(() => <div data-tid='seats-content' />),
);
jest.mock(
    'frontend/components/renderings/SuccessfulAmendmentPopup/components/RoomAndBoardPopupContent/RoomAndBoardPopupContent',
    () => jest.fn(() => <div data-tid='room-and-board-content' />),
);

describe('getPopupSubtitle', () => {
    const mockFields = {
        TransferSubtitle: mockSitecoreField('Transfer to {name}'),
        DatesSubtitle: mockSitecoreField('Subtitle'),
    } as ISuccessfulAmendmentPopupFields;

    const transferName = mockBooking?.transfers[0]?.name;

    it('should return the correct subtitle for Transfer AmendmentType', () => {
        const result = getPopupSubtitle(mockFields, transferName, AmendmentType.Transfer);

        expect(result.value).toBe("Transfer to <strong>'Private taxi'</strong>");
    });

    it('should return the correct subtitle for any AmendmentType', () => {
        const result = getPopupSubtitle(mockFields, transferName, AmendmentType.Dates);

        expect(result.value).toBe('Subtitle');
    });
});

describe('getPopupContent', () => {
    it('returns flight popup content', () => {
        render(getPopupContent(AmendmentType.Flight));

        expect(screen.getByTestId('flights-content')).toBeInTheDocument();
    });

    it('returns dates popup content', () => {
        render(getPopupContent(AmendmentType.Dates));

        expect(screen.getByTestId('dates-content')).toBeInTheDocument();
    });

    it('returns seats popup content', () => {
        render(getPopupContent(AmendmentType.Seats));

        expect(screen.getByTestId('seats-content')).toBeInTheDocument();
    });

    it('returns room and board popup content', () => {
        render(getPopupContent(AmendmentType.RoomAndBoard));

        expect(screen.getByTestId('room-and-board-content')).toBeInTheDocument();
    });

    it('returns null if no AmendmentType', () => {
        render(getPopupContent(null as any));

        expect(screen.queryByTestId('room-and-board-content')).not.toBeInTheDocument();
    });
});
