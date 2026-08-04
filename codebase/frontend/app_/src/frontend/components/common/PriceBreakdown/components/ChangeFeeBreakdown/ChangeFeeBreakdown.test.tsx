import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ChangeFeeBreakdown from './ChangeFeeBreakdown';

expect.extend(toHaveNoViolations);

let mockProps: IFeePerPerson;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ChangeFeeBreakdown /> ', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            feesPerPersonAmount: 10,
            feesCount: 2,
        };
    });

    it('Should render component', () => {
        render(<ChangeFeeBreakdown {...mockProps} />);

        expect(screen.getByTestId('person-fee')).toBeInTheDocument();
        expect(screen.getByTestId('person-fee')).toHaveTextContent(
            `(£10 x 2 ${SitecoreDictionary.IframePromotingHolidaysLabelsPeoplePlural})`,
        );
    });

    it('Should render component with single passenger', () => {
        mockProps.feesCount = 1;
        render(<ChangeFeeBreakdown {...mockProps} />);

        expect(screen.getByTestId('person-fee')).toBeInTheDocument();
        expect(screen.getByTestId('person-fee')).toHaveTextContent(
            `(£10 x 1 ${SitecoreDictionary.IframePromotingHolidaysLabelsPeopleSingular})`,
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ChangeFeeBreakdown {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
