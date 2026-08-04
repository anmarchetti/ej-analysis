import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { GenericValues } from 'models/data/tracking/AmendEvent';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendDates, { IAmendDatesFields } from './AmendDates';

const createMockProps = () => ({
    fields: {
        Title: mockSitecoreField('Amend Dates'),
        Subtitle: mockSitecoreField('Amend Dates subtitle'),
        isStickySummaryEnabled: mockSitecoreField(true),
        isAttentionMessageEnabled: mockSitecoreField(true),
        PopupTitle: mockSitecoreField('PopupTitle'),
        PopupSubtext: mockSitecoreField('PopupSubtext'),
        PopupCTA: mockSitecoreField('PopupCTA'),
        PopupIcon: mockSitecoreField(mockSitecoreImageField('PopupIcon')),
        Phone: mockSitecoreField('Phone'),
        AttentionPopupSubtext: mockSitecoreField('AttentionPopupSubtext'),
        AttentionPopupCloseCTALabel: mockSitecoreField('AttentionPopupCloseCTALabel'),
        AttentionPopupTitle: mockSitecoreField('AttentionPopupTitle'),
    } as IAmendDatesFields,
    rendering: {
        placeholder: PlaceholderNames.AttentionMessage,
    },
});

let mockStores;
let mockProps = createMockProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder'>{props.children}</div>;
    },
    Text: ({ field }) => <div>{field.value}</div>,
}));

jest.mock('frontend/components/renderings/AmendDates/components/ViewCalendar/ViewCalendar', () => ({
    __esModule: true,
    default: () => <div>ViewCalendar</div>,
}));

jest.mock('frontend/components/renderings/AmendmentBasket/components/DatesBasket/DatesBasket', () => ({
    __esModule: true,
    default: () => <div data-tid='dates-basket' />,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const mockAmendHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageHeader/AmendPageHeader', () => ({
    __esModule: true,
    default: props => {
        mockAmendHeaderProps(props);

        return <div data-tid='amend-header' />;
    },
}));

const mockOverlaySpinnerProps = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinnerProps(props);

        return <div data-tid='overlay-spinner' />;
    },
}));

const mockWarningPopupProps = jest.fn();
jest.mock('frontend/components/renderings/WarningPopup/WarningPopup', () => ({
    __esModule: true,
    default: props => {
        mockWarningPopupProps(props);
        const onLinkClick = () => {
            props.onDescriptionLinkClick({ target: { href: 'tel:123' } });
        };

        return (
            <div data-tid='warning-popup'>
                <button onClick={props.onClose} data-tid='warning-popup-close' />
                <button onClick={onLinkClick} data-tid='warning-popup-description-link' />
                <button onClick={props.onSecondaryCtaClick} data-tid='warning-popup-secondary-cta' />
            </div>
        );
    },
}));

describe('<AmendDates />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: mockAmendDatesStore,
            routerStore: {
                redirectToAmendDatesSummaryPage: jest.fn(),
            },
            trackingStore: {
                trackNewDateSelectionEvent: jest.fn(),
            },
        });
        mockProps = createMockProps();
    });

    it('Should clear cancel token when unmount', () => {
        const { unmount } = render(<AmendDates {...mockProps} />);
        unmount();

        expect(mockStores.amendDatesStore.breakSubmitRequest).toHaveBeenCalled();
    });

    it('Should render initial state components', () => {
        render(<AmendDates {...mockProps} />);

        expect(screen.getByTestId('date-change-summary-header')).toBeInTheDocument();
        expect(screen.queryByTestId('overlay-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('amend-header')).toBeInTheDocument();
        expect(screen.getByText('ViewCalendar')).toBeInTheDocument();
        expect(mockAmendHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: { value: 'Amend Dates' },
                subtitle: { value: 'Amend Dates subtitle' },
                isAttentionMessageOn: true,
                rendering: { placeholder: PlaceholderNames.AttentionMessage },
                isBackgroundGrey: true,
            }),
        );
    });

    it('Should render header without grey background on mobile', () => {
        mockUseMobileViewport = true;

        render(<AmendDates {...mockProps} />);
        expect(mockAmendHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isBackgroundGrey: false,
            }),
        );
    });

    it('Should render loading screen', () => {
        mockStores.amendDatesStore.isSubmitDatesLoading = true;
        render(<AmendDates {...mockProps} />);

        expect(screen.queryByTestId('overlay-spinner')).toBeInTheDocument();
        expect(mockOverlaySpinnerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                header: 'AmendDates.Labels.ValidatingDates',
            }),
        );
    });

    describe('MobileBasket', () => {
        it('Should render mobile amendment basket when isMobile', () => {
            mockUseMobileViewport = true;

            render(<AmendDates {...mockProps} />);
            expect(screen.queryByTestId('date-change-summary-header')).not.toBeInTheDocument();
            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.MobileBasket,
                    rendering: { placeholder: 'attention-message' },
                    showPrice: false,
                    hasOptionSelected: mockStores.amendDatesStore.isDatesChanged,
                    handleSubmit: mockStores.amendDatesStore.submitDates,
                    applyNegativeMargin: true,
                }),
            );

            expect(screen.getByTestId('dates-basket')).toBeInTheDocument();
        });

        it('Should not render mobile amendment basket when not mobile', () => {
            mockUseMobileViewport = false;

            render(<AmendDates {...mockProps} />);
            expect(screen.getByTestId('date-change-summary-header')).toBeInTheDocument();
            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
            expect(screen.queryByTestId('dates-basket')).not.toBeInTheDocument();
        });
    });

    describe('numberOfNightsLabel', () => {
        it('Should render number of night in single form', () => {
            mockStores.amendDatesStore.numberOfNights = 1;

            render(<AmendDates {...mockProps} />);
            expect(screen.getByText('Globals.Labels.NumberOfNight')).toBeInTheDocument();
        });

        it('Should render number of night in plural form', () => {
            mockStores.amendDatesStore.numberOfNights = 2;

            render(<AmendDates {...mockProps} />);
            expect(screen.getByText('Globals.Labels.NumberOfNights')).toBeInTheDocument();
        });
    });

    describe('Alternative Package Warning Popup', () => {
        beforeEach(() => {
            mockStores.amendDatesStore.isAlternativePackagePopupShown = true;
        });

        it('Should render with appropriate props when offer parameters has been changed', () => {
            render(<AmendDates {...mockProps} />);

            expect(screen.getByTestId('warning-popup')).toBeInTheDocument();
            expect(mockWarningPopupProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.AttentionPopupTitle,
                    description: mockProps.fields.AttentionPopupSubtext,
                    icon: mockProps.fields.PopupIcon,
                    ctaText: { value: SitecoreDictionary.GlobalsButtonsContinue },
                    onClose: expect.any(Function),
                    secondaryCtaText: mockProps.fields.AttentionPopupCloseCTALabel,
                    onSecondaryCtaClick: expect.any(Function),
                    id: 'alternative-package-popup',
                }),
            );
        });

        it('Should call tracking, close popup and redirect to summary page on continue button click', async () => {
            const departureDate = new Date('2020-12-12');
            mockStores.amendDatesStore.selectedDepartureDate = departureDate;
            render(<AmendDates {...mockProps} />);

            await userEvent.click(screen.getByTestId('warning-popup-secondary-cta'));

            expect(mockStores.trackingStore.trackNewDateSelectionEvent).toHaveBeenCalledWith({
                genericValue1: GenericValues.AlternativeMatchingAvailability,
                genericValue2: GenericValues.BackToCalendar,
            });
            expect(mockStores.amendDatesStore.setIsAlternativePackagePopupShown).toHaveBeenCalledWith(false);
            expect(mockStores.amendDatesStore.refreshAvailableDates).toHaveBeenCalledWith(departureDate);
        });

        it('Should call refreshAvailableDates and tracking on close popup button click', async () => {
            render(<AmendDates {...mockProps} />);

            await userEvent.click(screen.getByTestId('warning-popup-close'));

            expect(mockStores.trackingStore.trackNewDateSelectionEvent).toHaveBeenCalledWith({
                genericValue1: GenericValues.AlternativeMatchingAvailability,
                genericValue2: GenericValues.Confirm,
            });
            expect(mockStores.amendDatesStore.setIsAlternativePackagePopupShown).toHaveBeenCalledWith(false);
            expect(mockStores.routerStore.redirectToAmendDatesSummaryPage).toHaveBeenCalledWith();
        });
    });

    describe('Dates Unavailable Warning popup', () => {
        beforeEach(() => {
            mockStores.amendDatesStore.isSelectedDatesUnavailable = true;
        });

        it('Should be rendered with props', () => {
            render(<AmendDates {...mockProps} />);

            expect(screen.getByTestId('warning-popup')).toBeInTheDocument();
            expect(mockWarningPopupProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    onDescriptionLinkClick: expect.any(Function),
                    title: mockProps.fields.PopupTitle,
                    description: mockProps.fields.PopupSubtext,
                    icon: mockProps.fields.PopupIcon,
                    ctaText: mockProps.fields.PopupCTA,
                    onClose: expect.any(Function),
                    id: 'dates-unavailable-popup',
                }),
            );
        });

        it('Should call onClose handler to refresh dates and call tracking', async () => {
            render(<AmendDates {...mockProps} />);

            const closeButton = screen.getByTestId('warning-popup-close');

            await userEvent.click(closeButton);

            expect(mockStores.trackingStore.trackNewDateSelectionEvent).toHaveBeenCalledWith({
                genericValue1: GenericValues.NoMatchingDates,
                genericValue2: GenericValues.BackToCalendar,
            });
            expect(mockStores.amendDatesStore.refreshAvailableDates).toHaveBeenCalled();
        });

        it('Should call tracking onDescriptionLinkClick if it contains tel: link', async () => {
            render(<AmendDates {...mockProps} />);

            const descriptionLink = screen.getByTestId('warning-popup-description-link');

            await userEvent.click(descriptionLink);

            expect(mockStores.trackingStore.trackNewDateSelectionEvent).toHaveBeenCalledWith({
                genericValue1: GenericValues.NoMatchingDates,
                genericValue2: GenericValues.HelpCallCentre,
            });
        });
    });
});
