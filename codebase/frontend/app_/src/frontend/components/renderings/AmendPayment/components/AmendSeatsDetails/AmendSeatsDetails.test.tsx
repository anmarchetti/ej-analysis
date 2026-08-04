import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import AmendSeatsDetails from './AmendSeatsDetails';

expect.extend(toHaveNoViolations);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

describe('<AmendSeatsDetails />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendPaymentStore: {
                booking: mockBooking,
            },
        });
        mockProps = {
            rendering: 'rendering',
        };
    });

    it('Should render component', () => {
        render(<AmendSeatsDetails {...mockProps} />);

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.SeatsAndBags,
                rendering: 'rendering',
                isNewSelection: true,
                booking: mockBooking,
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendSeatsDetails {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
