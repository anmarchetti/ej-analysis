import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';

import AmendHotelEntry, { IAmendHotelEntry } from './AmendHotelEntry';

expect.extend(toHaveNoViolations);

let mockProps: IAmendHotelEntry;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid='button' onClick={props.onClick} aria-label='button' />;
    },
}));

describe('<AmendHotelEntry />', () => {
    beforeEach(() => {
        mockProps = {
            label: 'Label',
            onClick: jest.fn(),
        };
        mockStores = createMockStores({
            amendHotelStore: {
                isAmendCTADisabled: false,
                isAmendCTAVisible: true,
                isLoadingAlternativeHotels: false,
            },
            routerStore: {
                isRedirectionLoading: false,
            },
        });
    });

    it('Should render component', () => {
        render(<AmendHotelEntry {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            isOutlined: true,
            isSmall: true,
            disabled: false,
            dataTid: 'amend-hotel-entry-cta',
            children: 'Label',
            onClick: mockProps.onClick,
            isLoading: false,
        });
    });

    it('Should render component when isLoadingAlternativeHotels is true', () => {
        mockStores.amendHotelStore.isLoadingAlternativeHotels = true;
        render(<AmendHotelEntry {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isLoading: true,
            }),
        );
    });

    it('Should render disabled button when isAmendCTADisabled is true', () => {
        mockStores.amendHotelStore.isAmendCTADisabled = true;
        render(<AmendHotelEntry {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: true,
            }),
        );
    });

    it('Should call onClick when button is clicked', () => {
        render(<AmendHotelEntry {...mockProps} />);

        screen.getByTestId('button').click();

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('Should NOT render component when isAmendCTAVisible is false', () => {
        mockStores.amendHotelStore.isAmendCTAVisible = false;
        const { container } = render(<AmendHotelEntry {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendHotelEntry {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
