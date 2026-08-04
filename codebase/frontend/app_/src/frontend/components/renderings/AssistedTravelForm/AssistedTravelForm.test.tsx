import React from 'react';
import { act } from 'react-dom/test-utils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { useChatbotTracking } from 'frontend/hooks/useChatbotTracking/useChatbotTracking';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { GuestType } from 'models/enum/GuestType';

import * as hooks from './hooks/useDynamicForm';
import { assistedTravelFormFieldsMock } from './mocks/fields.mocks';
import { IFormSection } from './models/types';
import AssistedTravelForm, { TAssistedTravelFormProps } from './AssistedTravelForm';

const createProps = (): TAssistedTravelFormProps => ({
    fields: assistedTravelFormFieldsMock,
    rendering: undefined,
    params: {},
});

const createStores = () =>
    createMockStores({
        viewBookingStore: {
            booking: mockBooking,
            initializeBookingFromPayload: jest.fn().mockResolvedValue({}),
            initializeAssistedTravelRequestsFetch: jest.fn(),
            clearAssistedTravelRequests: jest.fn(),
            isAssistedTravelRequestsLoading: false,
            isAssistedTravelRequestsFailedToLoad: false,
        },
        routerStore: {
            redirectToViewBookingPage: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useChatbotTracking/useChatbotTracking', () => ({
    useChatbotTracking: jest.fn(),
}));

jest.mock('frontend/utils/offer.utils', () => ({
    containsFAndHPromoCode: jest.fn(() => false),
}));

const mockFormHeaderProps = jest.fn();
jest.mock('./components/FormHeader/FormHeader', () => ({
    __esModule: true,
    default: props => {
        mockFormHeaderProps(props);

        return <div data-tid='form-header' />;
    },
}));

const mockCustomerSelectionSection = jest.fn();
jest.mock('./components/CustomerSelectionSection/CustomerSelectionSection', () => ({
    __esModule: true,
    default: props => {
        mockCustomerSelectionSection(props);

        return (
            <div data-tid='customer-selection-section'>
                <button
                    data-tid='next-section'
                    onClick={() => {
                        props.goToScreen('DynamicSection');
                    }}
                />
                <button
                    data-tid='select-customer'
                    onClick={() => {
                        props.selectCustomer(props.guests[0]);
                    }}
                />
            </div>
        );
    },
}));

const mockIntroductionSection = jest.fn();
jest.mock('./components/IntroductionSection/IntroductionSection', () => ({
    __esModule: true,
    default: props => {
        mockIntroductionSection(props);

        return (
            <div data-tid='introduction-section'>
                <button
                    data-tid='next-section'
                    onClick={() => {
                        props.goToScreen('CustomerSelection');
                    }}
                />
            </div>
        );
    },
}));

const mockDynamicForm = jest.fn();
jest.mock('./components/DynamicForm/DynamicForm', () => ({
    __esModule: true,
    default: props => {
        mockDynamicForm(props);

        return <div data-tid='dynamic-form' />;
    },
}));

const mockPopup = jest.fn();
jest.mock('./components/Popup/Popup', () => ({
    __esModule: true,
    default: props => {
        mockPopup(props);

        return <div data-tid='popup' />;
    },
}));

jest.mock('./components/LoadingState/LoadingState', () => ({
    __esModule: true,
    default: () => <div data-tid='loading-state' />,
}));

jest.mock('frontend/utils/passenger.utils', () => ({
    ...jest.requireActual('frontend/utils/passenger.utils'),
    getFullPassengerName: jest.fn(() => 'John D. Doe'),
}));

const mockResetAnswers = jest.fn();
const mockUseAssistedTravelForm = jest.spyOn(hooks, 'useDynamicForm').mockReturnValue({
    currentStepInProgressBar: 0,
    totalProgressBarSteps: 0,
    currentSectionName: 'test',
    resetDynamicForm: mockResetAnswers,
    answers: new Map(),
    errors: new Map(),
    isQuestionVisible: jest.fn(),
    setAnswer: jest.fn(),
    goNext: jest.fn(),
    goPrev: jest.fn(),
    validateCurrentSection: jest.fn(() => true),
    currentSection: {} as IFormSection,
    goToFormStart: jest.fn(),
});

describe('<AssistedTravelForm />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if fields are undefined', () => {
        mockProps.fields = undefined;

        const { container } = render(<AssistedTravelForm {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should call useChatbotTracking with booking and containsFAndHPromoCode result', () => {
        (containsFAndHPromoCode as jest.Mock).mockReturnValue(true);

        render(<AssistedTravelForm {...mockProps} />);

        expect(containsFAndHPromoCode).toHaveBeenCalledWith(mockBooking.promoCollections || []);
        expect(useChatbotTracking).toHaveBeenCalledWith(mockBooking, true);
    });

    it('should fetch booking and initialize assisted travel requests and clear request on unmount', async () => {
        const { unmount } = render(<AssistedTravelForm {...mockProps} />);

        await waitFor(() => {
            expect(mockStores.viewBookingStore.initializeBookingFromPayload).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.initializeAssistedTravelRequestsFetch).toHaveBeenCalledWith(false, true);
        });

        unmount();

        expect(mockStores.viewBookingStore.clearAssistedTravelRequests).toHaveBeenCalled();
    });

    it('should render FormHeader and IntroductionSection by default', () => {
        render(<AssistedTravelForm {...mockProps} />);

        expect(screen.getByTestId('form-header')).toBeInTheDocument();
        expect(mockFormHeaderProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            currentScreen: 'Introduction',
            currentStepInProgressBar: 0,
            currentSectionTitle: 'SummaryTitle',
            customerFullName: '',
            isAdult: false,
            togglePopup: expect.any(Function),
            totalProgressBarSteps: 0,
        });
        expect(screen.getByTestId('introduction-section')).toBeInTheDocument();
        expect(mockIntroductionSection).toHaveBeenCalledWith({
            fields: mockProps.fields!.IntroductionSectionFields.fields,
            goToScreen: expect.any(Function),
            togglePopup: expect.any(Function),
        });
    });

    it('should render CustomerSelectionSection when currentSection is CustomerSelection and pass guests without infants', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            guests: [
                ...mockBooking.guests,
                {
                    id: '3',
                    name: 'Infant Guest',
                    type: GuestType.Infant,
                },
            ],
        };
        render(<AssistedTravelForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('next-section'));
        expect(screen.getByTestId('form-header')).toBeInTheDocument();
        expect(screen.getByTestId('customer-selection-section')).toBeInTheDocument();
        expect(mockCustomerSelectionSection).toHaveBeenCalledWith({
            fields: assistedTravelFormFieldsMock.CustomerSelectionSectionFields.fields,
            selectCustomer: expect.any(Function),
            goToScreen: expect.any(Function),
        });
    });

    it('should render DynamicSection when currentSection is DynamicSection', async () => {
        render(<AssistedTravelForm {...mockProps} />);

        await userEvent.click(screen.getByTestId('next-section'));
        await userEvent.click(screen.getByTestId('next-section'));
        expect(screen.getByTestId('form-header')).toBeInTheDocument();
        expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
        expect(mockDynamicForm).toHaveBeenCalledWith({
            formState: mockUseAssistedTravelForm.mock.results[0].value,
            togglePopup: expect.any(Function),
        });
    });

    it('should toggle BackButtonWarning popup on back button press', () => {
        render(<AssistedTravelForm {...mockProps} />);
        act(() => {
            globalThis.dispatchEvent(new PopStateEvent('popstate'));
        });
        expect(mockUseAssistedTravelForm).toHaveBeenCalled();
        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: assistedTravelFormFieldsMock.ContactUsPopupFields.fields,
            }),
        );
    });

    it('should render loading state when isAssistedTravelRequestsLoading is true', () => {
        mockStores.viewBookingStore.isAssistedTravelRequestsLoading = true;
        render(<AssistedTravelForm {...mockProps} />);

        expect(screen.getByTestId('loading-state')).toBeInTheDocument();
        expect(screen.queryByTestId('form-container')).not.toBeInTheDocument();
        expect(screen.getByTestId('form-header')).toBeInTheDocument();
    });

    it('should toggle FailedToLoadAssistedTravelRequests popup when isAssistedTravelRequestsFailedToLoad is true', () => {
        mockStores.viewBookingStore.isAssistedTravelRequestsFailedToLoad = true;
        render(<AssistedTravelForm {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: assistedTravelFormFieldsMock.FailedToLoadPopupFields.fields,
            }),
        );
    });

    it('should scroll to top when currentScreen changes', async () => {
        window.scrollTo = jest.fn();
        render(<AssistedTravelForm {...mockProps} />);

        (window.scrollTo as jest.Mock).mockClear();

        await userEvent.click(screen.getByTestId('next-section'));

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    describe('selectCustomer callback', () => {
        const getSelectCustomer = () => mockCustomerSelectionSection.mock.calls.at(-1)[0].selectCustomer;

        it('should set selectedCustomer when a customer is selected', async () => {
            render(<AssistedTravelForm {...mockProps} />);
            await userEvent.click(screen.getByTestId('next-section'));

            act(() => {
                getSelectCustomer()(mockBooking.guests[0]);
            });

            expect(mockFormHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({ customerFullName: 'John D. Doe' }),
            );
        });

        it('should call resetAnswers when a customer is selected for the first time', async () => {
            render(<AssistedTravelForm {...mockProps} />);
            await userEvent.click(screen.getByTestId('next-section'));

            act(() => {
                getSelectCustomer()(mockBooking.guests[0]);
            });

            expect(mockResetAnswers).toHaveBeenCalledTimes(1);
        });

        it('should call resetAnswers when a different customer is selected', async () => {
            render(<AssistedTravelForm {...mockProps} />);
            await userEvent.click(screen.getByTestId('next-section'));

            act(() => {
                getSelectCustomer()(mockBooking.guests[0]);
            });
            mockResetAnswers.mockClear();

            act(() => {
                getSelectCustomer()(mockBooking.guests[1]);
            });

            expect(mockResetAnswers).toHaveBeenCalledTimes(1);
        });

        it('should NOT call resetAnswers when the same customer is selected again', async () => {
            render(<AssistedTravelForm {...mockProps} />);
            await userEvent.click(screen.getByTestId('next-section'));

            act(() => {
                getSelectCustomer()(mockBooking.guests[0]);
            });
            mockResetAnswers.mockClear();

            act(() => {
                getSelectCustomer()(mockBooking.guests[0]);
            });

            expect(mockResetAnswers).not.toHaveBeenCalled();
        });
    });
});
