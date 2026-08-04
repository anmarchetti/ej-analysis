import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomAllocationGuestsNumber, { IRoomAllocationGuestsNumberProps } from './RoomAllocationGuestsNumber';

jest.mock('frontend/components/icons-new/Minus', () => ({
    __esModule: true,
    default: () => <svg data-tid='svg-minus' />,
}));

jest.mock('frontend/components/icons-new/Plus', () => ({
    __esModule: true,
    default: () => <svg data-tid='svg-plus' />,
}));

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='svg-warning-filled' />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ icon, message, ...props }) => {
        mockErrorMessageProps(props);

        return (
            <div data-tid='error-message'>
                {icon}
                {message}
            </div>
        );
    },
}));

const createProps = (): IRoomAllocationGuestsNumberProps => ({
    errorMsgs: [],
    hideErrors: true,
    icon: <div data-tid='mock-icon' />,
    isAddDisabled: false,
    isRemoveDisabled: false,
    number: 10,
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    title: 'title',
});

let mockProps: IRoomAllocationGuestsNumberProps;
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('RoomAllocationGuestsNumber', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render standard', () => {
        render(<RoomAllocationGuestsNumber {...mockProps} />);

        expect(screen.getByTestId('room-allocation-title')).toBeInTheDocument();
        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
        expect(screen.getByTestId('svg-plus')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton')).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('spinbutton')).toHaveAttribute('readOnly');
        expect(screen.getByTestId('svg-minus')).toBeInTheDocument();
    });

    describe('ErrorMessage', () => {
        beforeEach(() => {
            mockProps.errorMsgs = ['err1', 'err2'];
        });

        it('should render as many as objects in the array when hideErrors is false', () => {
            mockProps.hideErrors = false;

            render(<RoomAllocationGuestsNumber {...mockProps} />);

            const errorMessages = screen.getAllByTestId('error-message');
            const errorMessage = errorMessages[0];

            expect(errorMessages).toHaveLength(mockProps.errorMsgs.length);
            expect(mockErrorMessageProps).toHaveBeenNthCalledWith(1, {
                errorMessageClass: 'errorMessage errorMessage',
                IsDesc: true,
            });
            expect(mockErrorMessageProps).toHaveBeenNthCalledWith(2, {
                errorMessageClass: 'errorMessage errorMessage',
                IsDesc: true,
            });
            expect(within(errorMessage).getByTestId('svg-warning-filled')).toBeInTheDocument();
            expect(within(errorMessage).getByTestId('rich-text-with-links')).toHaveTextContent(mockProps.errorMsgs[0]);
        });

        it('should NOT render when hideErrors is true', () => {
            mockProps.hideErrors = true;

            render(<RoomAllocationGuestsNumber {...mockProps} />);

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });

        it('should NOT render when errorMsgs is an empty array', () => {
            mockProps.errorMsgs = [];

            render(<RoomAllocationGuestsNumber {...mockProps} />);

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
    });

    it('should not be possible to change value directly inside input', async () => {
        render(<RoomAllocationGuestsNumber {...mockProps} />);

        const input = screen.getByRole('spinbutton');

        await userEvent.type(input, '20');

        expect(mockProps.onAdd).not.toHaveBeenCalled();
        expect(mockProps.onRemove).not.toHaveBeenCalled();
        expect(input).toHaveValue(10);
    });

    it('should call onAdd by click on button', () => {
        render(<RoomAllocationGuestsNumber {...mockProps} />);

        fireEvent.click(screen.getByTestId('add'));

        expect(mockProps.onAdd).toHaveBeenCalled();
    });

    it('should call onRemove by click on button', () => {
        render(<RoomAllocationGuestsNumber {...mockProps} />);

        fireEvent.click(screen.getByTestId('remove'));

        expect(mockProps.onRemove).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should render aria-label', () => {
            render(<RoomAllocationGuestsNumber {...mockProps} />);

            expect(screen.getByTestId('remove')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsNumberOfGuestsMinus,
            );
            expect(screen.getByTestId('add')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsNumberOfGuestsPlus,
            );
        });
    });
});
