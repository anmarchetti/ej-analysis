import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { DataStatus } from 'models/enum/DataStatus';

import AmendFlightsButton from './AmendFlightsButton';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockButtonProps(props);

        return <button data-tid='button' onClick={onClick} />;
    },
}));

const createProps = () => ({
    onClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        amendFlightsStore: {
            isAmendCTADisabled: false,
        },
    });

let mockProps;
let mockStores;

describe('AmendFlightsButton', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render button', () => {
        render(<AmendFlightsButton {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isSmall: true,
                isOutlined: true,
                isLoading: false,
                disabled: false,
                children: 'ViewBooking.Buttons.AmendFlights',
            }),
        );
    });

    it('Should call onClick when button is clicked', () => {
        render(<AmendFlightsButton {...mockProps} />);
        const button = screen.getByTestId('button');

        fireEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('Should render button as loading', () => {
        mockStores.amendFlightsStore.status = DataStatus.Loading;
        render(<AmendFlightsButton {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isLoading: true,
            }),
        );
    });

    it('Should render disabled button', () => {
        mockStores.amendFlightsStore.isAmendCTADisabled = true;
        render(<AmendFlightsButton {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: true,
            }),
        );
    });
});
