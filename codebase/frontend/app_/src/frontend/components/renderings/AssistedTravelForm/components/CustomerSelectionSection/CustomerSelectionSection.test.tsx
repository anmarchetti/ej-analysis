import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockGuests } from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';
import { customerSelectionSectionFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';
import { Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import CustomerSelectionSection, { ICustomerSelectionSectionProps } from './CustomerSelectionSection';

const createProps = (): ICustomerSelectionSectionProps => ({
    fields: customerSelectionSectionFieldsMock,
    goToScreen: jest.fn(),
    selectCustomer: jest.fn(),
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSectionWrapperProps = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/SectionWrapper/SectionWrapper', () => ({
    __esModule: true,
    default: props => {
        mockSectionWrapperProps(props);

        return (
            <div data-tid='section-wrapper'>
                {props.children}
                <button data-tid='secondary-button' onClick={props.secondaryBtnAction} />
            </div>
        );
    },
}));

const mockQuestionHeader = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader', () => ({
    __esModule: true,
    default: props => {
        mockQuestionHeader(props);

        return <div data-tid='question-header' />;
    },
}));

jest.mock('frontend/utils/passenger.utils', () => ({
    ...jest.requireActual('frontend/utils/passenger.utils'),
    getFullPassengerName: jest.fn(() => 'John D. Doe'),
}));

describe('<CustomerSelectionSection />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                guestWithAssistedTravelRequest: [
                    {
                        passengerName: 'John D. Doe',
                        requestedAt: null,
                        passenger: mockGuests[0],
                    },
                    {
                        passengerName: 'John D. Doe',
                        requestedAt: null,
                        passenger: { ...mockGuests[1], type: GuestType.Child },
                    },
                ],
            },
        });
    });

    it('should render section header and guests', () => {
        render(<CustomerSelectionSection {...mockProps} />);

        expect(screen.getByTestId('section-wrapper')).toBeInTheDocument();
        expect(mockSectionWrapperProps).toHaveBeenCalledWith({
            secondaryBtnText: mockProps.fields.SecondaryButtonLabel,
            secondaryBtnScreenReaderText: mockProps.fields.SecondaryButtonScreenReaderText,
            secondaryBtnAction: expect.any(Function),
            children: expect.anything(),
        });

        expect(screen.getByTestId('question-header')).toBeInTheDocument();
        expect(mockQuestionHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title.value,
            description: mockProps.fields.Description.value,
        });

        expect(screen.getAllByRole('button').length).toBe(3); // 2 guests + 1 secondary button
        expect(screen.getByText('John D. Doe')).toBeInTheDocument();
        expect(screen.getByText(`John D. Doe ${mockProps.fields.Under18Label.value}`)).toBeInTheDocument();

        expect(screen.getByTestId('child-circle-icon')).toBeInTheDocument();
        expect(screen.getByTestId('user-circle-icon')).toBeInTheDocument();
    });

    it('should call selectCustomer and goToSection on guest click', async () => {
        render(<CustomerSelectionSection {...mockProps} />);

        await userEvent.click(screen.getAllByRole('button')[0]);

        expect(mockProps.selectCustomer).toHaveBeenCalled();
        expect(mockProps.goToScreen).toHaveBeenCalledWith(Screen.DynamicSection);
    });

    it('should render customer button as disabled and show requested on text if assisted travel is already requested for the guest', () => {
        mockStores.viewBookingStore.guestWithAssistedTravelRequest[0].requestedAt = '2024-01-01';

        render(<CustomerSelectionSection {...mockProps} />);

        const guestButtons = screen.getAllByRole('button');
        const firstGuestButton = guestButtons[0];
        expect(firstGuestButton).toBeDisabled();
        expect(within(firstGuestButton).getByText('John D. Doe')).toBeInTheDocument();
        expect(within(firstGuestButton).getByText('AssistedRequestedOnLabel 2024-01-01')).toBeInTheDocument();

        expect(guestButtons[1]).not.toBeDisabled();
    });
});
