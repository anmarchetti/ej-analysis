import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { flattenedSpecialRequests } from 'frontend/__mocks__/flattenedSpecialRequests';
import { updateIgnoreCodes } from 'frontend/hooks/useSpecialRequests';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { specialRequestsFields } from 'frontend/components/renderings/SpecialRequests/__mocks__/SpecialRequestsFields';
import {
    getContradictingItems,
    getSelectedRequestsCodes,
    isSelectedRequestsDifferFromOriginal,
} from 'frontend/components/renderings/SpecialRequests/specialRequests.utils';

import BookingSpecialRequestsAmendPopup, {
    IBookingSpecialRequestsAmendPopup,
} from './BookingSpecialRequestsAmendPopup';

const createProps = (): IBookingSpecialRequestsAmendPopup => ({
    bookingRequests: [],
    fields: specialRequestsFields,
    isOpen: true,
    isAmendSSRLoading: false,
    isAmendSSRFailed: false,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    booking: mockBooking,
});

const createStores = () =>
    createMockStores({
        appStore: { isScreenMedium: true, isScreenLessMedium: false },
    });

const createLocalStore = () => ({
    tracking: {
        handleClickSpecialRequestItem: jest.fn(),
        openSpecialRequests: jest.fn(),
        submitSpecialRequests: jest.fn(),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SpecialRequests/stores/createLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SpecialRequests/stores/createLocalStore'),
    useSRLocalStore: () => mockUseSRLocalStore,
}));

const mockFlattenedSpecialRequests = [flattenedSpecialRequests, []];
jest.mock('frontend/hooks/useSpecialRequests', () => ({
    __esModule: true,
    getAllSpecialRequests: jest.fn(() => mockFlattenedSpecialRequests),
    getIgnoredCodes: jest.fn(() => []),
    updateIgnoreCodes: jest.fn(),
}));

jest.mock('frontend/components/renderings/SpecialRequests/specialRequests.utils', () => ({
    __esModule: true,
    getContradictingItems: jest.fn(),
    getSelectedRequestsCodes: jest.fn(),
    isSelectedRequestsDifferFromOriginal: jest.fn(),
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const mockSitecoreTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockSitecoreTextProps(props);

        return <div data-tid='sitecore-jss-text'>{props.field.value}</div>;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid={props.dataTid} onClick={props.onClick} />;
    },
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerProps(props);

        return <div data-tid='drawer'>{children}</div>;
    },
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupProps(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

const mockContradictorySpecialRequestPopup = jest.fn();
jest.mock(
    'frontend/components/renderings/SpecialRequests/components/ContradictorySpecialRequestPopup/ContradictorySpecialRequestPopup',
    () => ({
        _esModule: true,
        ContradictorySpecialRequestPopup: props => {
            mockContradictorySpecialRequestPopup(props);

            return (
                <div data-tid='contradictory-special-request-popup'>
                    <button
                        data-tid='contradictory-special-request-popup-submit'
                        onClick={() => props.onSubmit(mockFlattenedSpecialRequests[0][0].code)}
                    />
                    <button data-tid='contradictory-special-request-popup-cancel' onClick={() => props.onCancel()} />
                </div>
            );
        },
    }),
);

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/ExtrasSpecialRequestsDrawer/ExtrasSpecialRequestsDrawerAlerts/ExtrasSpecialRequestsDrawerAlerts',
    () => () => <div data-tid='extras-special-requests-drawer-alerts' />,
);

const mockErrorMessage = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: props => {
        mockErrorMessage(props);

        return <div data-tid='error-message' />;
    },
}));

const mockSpecialRequestItem = jest.fn();
jest.mock('frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem', () => ({
    __esModule: true,
    default: props => {
        mockSpecialRequestItem(props);

        return <div data-tid='special-request-item' onClick={() => props.onSelect(props.item.code)} />;
    },
}));

let mockProps;
let mockStores = createStores();
let mockUseSRLocalStore;

describe('<BookingSpecialRequestsAmendPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockUseSRLocalStore = createLocalStore();
    });

    it('Should NOT render component on desktop if popup is closed', () => {
        mockProps.isOpen = false;
        const { container } = render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render Popup on desktop', () => {
        render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('Should render Drawer on mobile', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    describe('Form content', () => {
        it('Should render title, description and contradictory popup', () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            expect(mockSitecoreTextProps).toHaveBeenCalledWith({
                field: mockProps.fields.AmendmentPopupTitle,
                tag: 'h4',
                className: 'title',
                'data-tid': 'booking-amend-special-requests-title',
            });

            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: mockProps.fields.AmendmentPopupDescription,
                tag: 'div',
                className: 'description',
                dataId: 'booking-amend-special-requests-description',
            });

            expect(mockContradictorySpecialRequestPopup).toHaveBeenCalledWith({
                contradictoryOptions: undefined,
                onSubmit: expect.any(Function),
                onCancel: expect.any(Function),
                fields: mockProps.fields,
                booking: mockProps.booking,
            });
        });

        it('Should render Special Requests items', () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            mockFlattenedSpecialRequests[0].forEach(request => {
                expect(mockSpecialRequestItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        item: request,
                        onSelect: expect.any(Function),
                        isSolid: mockStores.appStore.isScreenLessMedium,
                        dataTid: 'booking-amend-special-requests-item',
                    }),
                );
            });
        });

        it('Should render errors and alerts', () => {
            mockProps.isAmendSSRFailed = true;

            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            expect(screen.queryByTestId('extras-special-requests-drawer-alerts')).not.toBeInTheDocument();
            expect(mockErrorMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: SitecoreDictionary.BookingSummaryErrorsAmendSpecialRequest,
                    description: SitecoreDictionary.BookingSummaryErrorsAmendSpecialRequestDescription,
                    errorMessageClass: 'errorMessage',
                }),
            );

            expect(mockErrorMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'alert',
                    errorMessageClass: 'errorMessage',
                    IfIsNotificationOrange: true,
                }),
            );
        });

        it('Should render drawer alerts on mobile', () => {
            mockProps.isOpen = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            expect(screen.getByTestId('extras-special-requests-drawer-alerts')).toBeInTheDocument();
        });

        it('Should render buttons', () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            expect(mockButtonProps).toHaveBeenNthCalledWith(1, {
                type: 'button',
                isTransparent: true,
                disabled: mockProps.isAmendSSRLoading,
                onClick: expect.any(Function),
                dataTid: 'booking-amend-special-requests-cancel-button',
                children: SitecoreDictionary.GlobalsButtonsCancel,
            });

            expect(mockButtonProps).toHaveBeenNthCalledWith(2, {
                type: 'submit',
                disabled: !mockProps.isDifferFromOriginal ?? mockProps.isAmendSSRLoading,
                isLoading: mockProps.isAmendSSRLoading,
                dataTid: 'booking-amend-special-requests-submit-button',
                children: SitecoreDictionary.BookingSummaryButtonsSubmitSpecialRequest,
            });
        });

        it('Should render submit button with different label on mobile', () => {
            mockStores.appStore.isScreenMedium = false;
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            expect(mockButtonProps).toHaveBeenCalledWith({
                type: 'submit',
                disabled: !mockProps.isDifferFromOriginal ?? mockProps.isAmendSSRLoading,
                isLoading: mockProps.isAmendSSRLoading,
                dataTid: 'booking-amend-special-requests-submit-button',
                children: SitecoreDictionary.GlobalsButtonsApply,
            });
        });
    });

    describe('Buttons click', () => {
        it('Should submit form when submit button is clicked', async () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            const submitButton = screen.getByTestId('booking-amend-special-requests-submit-button');

            await userEvent.click(submitButton);

            expect(getSelectedRequestsCodes).toHaveBeenCalledWith(mockFlattenedSpecialRequests[0]);
            expect(mockProps.onSubmit).toHaveBeenCalled();
            expect(mockUseSRLocalStore.tracking.submitSpecialRequests).toHaveBeenCalledWith(
                mockProps.booking.bookingReference,
                mockFlattenedSpecialRequests[0].filter(({ isSelected }) => isSelected),
            );
        });

        it('Should call onClose event when close button is clicked', async () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            const closeButton = screen.getByTestId('booking-amend-special-requests-cancel-button');

            await userEvent.click(closeButton);

            expect(mockProps.onClose).toHaveBeenCalled();
        });

        it('Should select special request item when it is clicked', async () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            const specialRequestItem = screen.getAllByTestId('special-request-item')[0];

            await userEvent.click(specialRequestItem);

            expect(getContradictingItems).toHaveBeenCalledWith(
                mockFlattenedSpecialRequests[0],
                mockFlattenedSpecialRequests[0][0].code,
            );
            expect(updateIgnoreCodes).toHaveBeenCalledWith(mockProps.booking.bookingReference, [
                mockFlattenedSpecialRequests[0][0].code,
            ]);
            expect(isSelectedRequestsDifferFromOriginal).toHaveBeenCalled();
        });

        it('Should NOT select special request item when it is clicked and isAmendSSRLoading is true', async () => {
            mockProps.isAmendSSRLoading = true;
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            const specialRequestItem = screen.getAllByTestId('special-request-item')[0];

            await userEvent.click(specialRequestItem);

            expect(getContradictingItems).not.toHaveBeenCalled();
            expect(updateIgnoreCodes).not.toHaveBeenCalledWith();
            expect(isSelectedRequestsDifferFromOriginal).not.toHaveBeenCalled();
        });

        it('Should select special request item when it is clicked in Contradictory Popup', async () => {
            render(<BookingSpecialRequestsAmendPopup {...mockProps} />);

            const submitButton = screen.getByTestId('contradictory-special-request-popup-submit');

            await userEvent.click(submitButton);

            expect(getContradictingItems).toHaveBeenCalledWith(
                mockFlattenedSpecialRequests[0],
                mockFlattenedSpecialRequests[0][0].code,
            );
            expect(updateIgnoreCodes).toHaveBeenCalledWith(mockProps.booking.bookingReference, [
                mockFlattenedSpecialRequests[0][0].code,
            ]);
            expect(isSelectedRequestsDifferFromOriginal).toHaveBeenCalled();
        });
    });
});
