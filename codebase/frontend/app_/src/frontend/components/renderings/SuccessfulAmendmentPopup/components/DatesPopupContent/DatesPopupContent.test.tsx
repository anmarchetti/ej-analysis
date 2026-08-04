import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { formatDateL10n, getDaysDifference } from 'frontend/utils/date.utils';
import DatesPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/DatesPopupContent/DatesPopupContent';

expect.extend(toHaveNoViolations);

const mockedGetDaysDifference = getDaysDifference as jest.MockedFunction<any>;
const mockedformatDateL10n = formatDateL10n as jest.MockedFunction<any>;
mockedformatDateL10n.mockImplementation(v => v);

let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));
jest.mock('frontend/utils/date.utils');

describe('DatesPopupContent', () => {
    beforeEach(() => {
        mockStore = createMockStores();
    });

    it('renders null if no booking', () => {
        mockStore.viewBookingStore.booking = null;
        const { container } = render(<DatesPopupContent />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders dates pop up content', () => {
        mockedGetDaysDifference.mockReturnValue(7);
        mockStore.viewBookingStore.booking.package.accom = {
            startDate: '2023-10-20',
            endDate: '2023-10-27',
        };
        render(<DatesPopupContent />);
        expect(screen.getByText(/2023-10-20/)).toBeInTheDocument();
        expect(screen.getByText(/2023-10-27/)).toBeInTheDocument();
        expect(screen.getByText(/7 Globals.Labels.NightsPlural/)).toBeInTheDocument();
    });

    it('renders singular label for 1 night', () => {
        mockedGetDaysDifference.mockReturnValue(1);
        mockStore.viewBookingStore.booking.package.accom = {
            startDate: '2023-10-20',
            endDate: '2023-10-21',
        };
        render(<DatesPopupContent />);
        expect(screen.getByText(/2023-10-20/)).toBeInTheDocument();
        expect(screen.getByText(/2023-10-21/)).toBeInTheDocument();
        expect(screen.getByText(/1 Globals.Labels.NightSingular/)).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<DatesPopupContent />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
