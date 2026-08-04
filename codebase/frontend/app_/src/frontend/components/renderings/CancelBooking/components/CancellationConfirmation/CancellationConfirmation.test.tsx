import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { CreditType } from 'models/enum/CreditType';
import { cancellationConfirmationFieldsMock } from 'frontend/components/renderings/CancelBooking/__mocks__/mockFields';

import CancellationConfirmation, { TCancellationConfirmationProps } from './CancellationConfirmation';

const createProps = (): TCancellationConfirmationProps => ({
    fields: cancellationConfirmationFieldsMock,
});

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            creditBooking: jest.fn(),
            cancelBooking: jest.fn(),
            selectedRefundType: CreditType.Credit,
            isCreditBookingLoading: false,
            isOneTimeUseCreditEnabled: false,
        },
        viewBookingStore: {
            clearBooking: jest.fn(),
        },
    });

let mockStores = createStores();
let mockProps = createProps();

const mockConfirmationCheckboxProps = jest.fn();
jest.mock('frontend/components/common/ConfirmationInfo/ConfirmationCheckbox', () => ({
    __esModule: true,
    default: props => {
        mockConfirmationCheckboxProps(props);

        return (
            <input type='checkbox' data-tid='confirmation-checkbox' onChange={props.onChange} checked={props.checked} />
        );
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return <button onClick={props.onClick}>{props.children}</button>;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text' />;
    },
}));

const mockInfoCircleIcon = jest.fn();
jest.mock('frontend/components/icons/InfoCircle', () => ({
    __esModule: true,
    default: props => {
        mockInfoCircleIcon(props);

        return <div data-tid='text' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ConfirmationInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render standard', () => {
        render(<CancellationConfirmation {...mockProps} />);

        expect(screen.getByTestId('cancellation-confirmation')).toBeInTheDocument();

        expect(mockInfoCircleIcon).toHaveBeenCalled();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields.ImportantInfoTitle,
            tag: 'h4',
            className: 'infoTitle',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.ImportantInfo,
        });
        expect(mockConfirmationCheckboxProps).toHaveBeenCalledWith({
            checked: false,
            label: mockProps.fields.ConfirmationCheckboxDescription,
            onChange: expect.any(Function),
            hasError: false,
        });
        expect(mockButton).toHaveBeenCalledWith({
            isFullWidth: true,
            isLarge: true,
            onClick: expect.any(Function),
            hasDisabledStyles: true,
            children: mockProps.fields.ConfirmButtonLabel.value,
            isLoading: false,
        });
    });

    it('Should confirm cancellation when confirm button is clicked and confirmation checkbox is checked', async () => {
        render(<CancellationConfirmation {...mockProps} />);

        const button = screen.getByRole('button');
        const checkbox = screen.getByRole('checkbox');

        await userEvent.click(checkbox);
        await userEvent.click(button);

        expect(mockStores.viewBookingStore.clearBooking).toHaveBeenCalled();
        expect(mockStores.holidayCreditStore.creditBooking).toHaveBeenCalledWith(
            mockStores.holidayCreditStore.selectedRefundType === CreditType.Credit,
        );
    });

    it('Should confirm cancellation with OTUC logic when OTUC is enabled', async () => {
        mockStores.holidayCreditStore.isOneTimeUseCreditEnabled = true;
        render(<CancellationConfirmation {...mockProps} />);

        const button = screen.getByRole('button');
        const checkbox = screen.getByRole('checkbox');

        await userEvent.click(checkbox);
        await userEvent.click(button);

        expect(mockStores.holidayCreditStore.cancelBooking).toHaveBeenCalled();
        expect(mockStores.holidayCreditStore.creditBooking).not.toHaveBeenCalled();
    });

    it('Should call cancelBooking when confirm button is clicked and it is Trade Portal', async () => {
        mockStores.layoutStore.isTradePortal = true;
        render(<CancellationConfirmation {...mockProps} />);
        const button = screen.getByRole('button');
        const checkbox = screen.getByRole('checkbox');

        await userEvent.click(checkbox);
        await userEvent.click(button);
        expect(mockStores.holidayCreditStore.cancelBooking).toHaveBeenCalled();
        expect(mockStores.holidayCreditStore.creditBooking).not.toHaveBeenCalled();
    });

    it('Should show error state for confirmation checkbox when confirm button is clicked but checkbox is NOT checked', async () => {
        render(<CancellationConfirmation {...mockProps} />);

        const button = screen.getByRole('button');

        await userEvent.click(button);

        expect(mockConfirmationCheckboxProps).toHaveBeenCalledWith({
            hasError: true,
            checked: false,
            label: mockProps.fields.ConfirmationCheckboxDescription,
            onChange: expect.any(Function),
        });
    });

    it('Should change checkbox state when checkbox is clicked', async () => {
        render(<CancellationConfirmation {...mockProps} />);

        const checkbox = screen.getByRole('checkbox');

        await userEvent.click(checkbox);

        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('Should show loading state on the button when isCreditBookingLoading = true', async () => {
        mockStores.holidayCreditStore.isCreditBookingLoading = true;
        render(<CancellationConfirmation {...mockProps} />);

        expect(mockButton).toHaveBeenCalledWith({
            isFullWidth: true,
            isLarge: true,
            onClick: expect.any(Function),
            hasDisabledStyles: true,
            children: mockProps.fields.ConfirmButtonLabel.value,
            isLoading: true,
        });
    });
});
