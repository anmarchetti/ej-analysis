import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import AmendDatesEntry, { IAmendDatesEntryProps } from './AmendDatesEntry';

const createMockProps = (): IAmendDatesEntryProps => ({
    onClick: jest.fn(),
    label: 'Label',
});

let mockStores;
let mockProps: IAmendDatesEntryProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={onClick}>
                {children}
            </button>
        );
    },
}));

describe('<AmendDatesEntry />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendDatesStore: {
                isAmendCTADisabled: false,
            },
        });
    });

    it('render button', () => {
        render(<AmendDatesEntry {...mockProps} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent('Label');
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: true,
                isSmall: true,
                disabled: false,
                isLoading: undefined,
                dataTid: 'amend-dates-entry-cta',
            }),
        );
    });

    it('invoke onClick function when click on button', () => {
        render(<AmendDatesEntry {...mockProps} />);

        fireEvent.click(screen.getByRole('button'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should show loading state when amendDatesStore.isInitialDataLoading is true', () => {
        mockStores.amendDatesStore.isInitialDataLoading = true;

        render(<AmendDatesEntry {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isLoading: true,
            }),
        );
    });

    it('should render disabled button', () => {
        mockStores.amendDatesStore.isAmendCTADisabled = true;
        render(<AmendDatesEntry {...mockProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: true,
            }),
        );
    });
});
