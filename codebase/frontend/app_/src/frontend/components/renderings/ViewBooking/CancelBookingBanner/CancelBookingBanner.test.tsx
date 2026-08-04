import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import SitePath from 'models/enum/SitePath';

import CancelBookingBanner, { RefundType, TCancelBookingBannerProps } from './CancelBookingBanner';

const createProps = (): TCancelBookingBannerProps => ({
    fields: {
        items: [
            {
                fields: {
                    CancellationType: { fields: { Value: mockSitecoreField(RefundType.LessThanXHours) } },
                    Title: mockSitecoreField('Less Than X Hours'),
                    Description: mockSitecoreField('Less Than {hours} Hours Text'),
                    CancelButtonLabel: mockSitecoreField('Less Than X Hours Cancel Button'),
                    ShowContactUsButton: mockSitecoreField(true),
                    TermsAndConditionsLink: mockSitecoreField(
                        mockSitecoreLinkField('/trade-conditions', 'Terms and Conditions'),
                    ),
                },
            },
            {
                fields: {
                    CancellationType: { fields: { Value: mockSitecoreField(RefundType.MoreThanXHours) } },
                    Title: mockSitecoreField('More Than X Hours'),
                    Description: mockSitecoreField('More Than X Hours Text'),
                    CancelButtonLabel: mockSitecoreField('More Than X Hours Cancel Button'),
                    ShowContactUsButton: mockSitecoreField(false),
                    TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField('', '')),
                },
            },
        ],
    },
    params: {},
    rendering: undefined,
});

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            initializeCancellation: jest.fn(),
            clearFetchCancellationSummary: jest.fn(),
            canBeBookingCancelledFromWebsite: true,
            isCancellationSummaryIsLoading: false,
            startBookingCancellation: jest.fn(),
            setPrevPagePath: jest.fn(),
        },
        viewBookingStore: {
            booking: {
                bookingStatus: 'BOOKED',
                amendmentInfo: {
                    canBookingCancelled: true,
                },
            } as IBookingInfo,
        },
        layoutStore: {
            getSetting: jest.fn(setting => {
                if (setting === 'EnableCancellationTradePortal') {
                    return true;
                }

                return '24';
            }),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/LoadingState/LoadingState', () => ({
    __esModule: true,
    default: () => <div data-tid='loading-state' />,
}));

const mockTextComponent = jest.fn();
const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid={props['data-tid']} />;
    },
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid={props.dataId} />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button onClick={props.onClick} data-tid={props['data-tid']} />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => props => {
    mockRouterLinkProps(props);

    return <div data-tid='router-link' />;
});

describe('<CancelBookingBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render loading state when cancellation summary is loading', () => {
        mockStores.holidayCreditStore.isCancellationSummaryIsLoading = true;
        render(<CancelBookingBanner {...mockProps} />);

        expect(screen.getByTestId('loading-state')).toBeInTheDocument();
        expect(screen.queryByTestId('cancel-booking-banner')).not.toBeInTheDocument();
    });

    it('should NOT render if booking was already canceled', () => {
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            bookingStatus: BookingStatus.Canceled,
        };
        const { container } = render(<CancelBookingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if cannot be cancelled from website', () => {
        mockStores.holidayCreditStore.canBeBookingCancelledFromWebsite = false;
        const { container } = render(<CancelBookingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no booking', () => {
        mockStores.viewBookingStore.booking = null;
        const { container } = render(<CancelBookingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if EnableCancellationTradePortal setting is false', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockImplementation(setting => {
            if (setting === 'EnableCancellationTradePortal') {
                return false;
            }

            return '24';
        });
        const { container } = render(<CancelBookingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render more than X hours content when canBookingCancelled is true', () => {
        mockStores.viewBookingStore.booking.amendmentInfo.canBookingCancelled = true;

        render(<CancelBookingBanner {...mockProps} />);

        const { Title, Description, CancelButtonLabel } = mockProps.fields!.items[1].fields;

        expect(screen.getByTestId('cancel-booking-banner')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-booking-banner-title')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            tag: 'h3',
            field: Title,
            className: 'title',
            'data-tid': 'cancel-booking-banner-title',
        });
        expect(screen.getByTestId('cancel-booking-banner-description')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'description',
            dataId: 'cancel-booking-banner-description',
            field: Description,
        });
        expect(screen.getByTestId('cancel-booking-banner-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            isOutlined: true,
            className: 'cancelButton',
            'data-tid': 'cancel-booking-banner-button',
            children: CancelButtonLabel.value,
        });

        expect(screen.queryByTestId('placeholder-contact-us')).not.toBeInTheDocument();
    });

    it('should render less than X hours content when canBookingCancelled is false', () => {
        mockStores.viewBookingStore.booking.amendmentInfo.canBookingCancelled = false;

        render(<CancelBookingBanner {...mockProps} />);

        const { Title, CancelButtonLabel } = mockProps.fields!.items[0].fields;

        expect(screen.getByTestId('cancel-booking-banner')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-booking-banner-title')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            tag: 'h3',
            field: Title,
            className: 'title',
            'data-tid': 'cancel-booking-banner-title',
        });
        expect(screen.getByTestId('cancel-booking-banner-description')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'description',
            dataId: 'cancel-booking-banner-description',
            field: { value: 'Less Than 24 Hours Text' },
        });
        expect(screen.getByTestId('cancel-booking-banner-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            isOutlined: true,
            className: 'cancelButton',
            'data-tid': 'cancel-booking-banner-button',
            children: CancelButtonLabel.value,
        });

        expect(screen.getByTestId('placeholder-contact-us')).toBeInTheDocument();
    });

    it('should start cancellation when cancel button is clicked', () => {
        mockStores.viewBookingStore.booking.amendmentInfo.canBookingCancelled = true;

        render(<CancelBookingBanner {...mockProps} />);
        const cancelButton = screen.getByTestId('cancel-booking-banner-button');

        fireEvent.click(cancelButton);

        expect(mockStores.holidayCreditStore.startBookingCancellation).toHaveBeenCalled();
        expect(mockStores.holidayCreditStore.setPrevPagePath).toHaveBeenCalledWith(SitePath.TradePortalViewBooking);
    });

    it('should render contact us placeholder when ShowContactUsButton is true', () => {
        mockStores.viewBookingStore.booking.amendmentInfo.canBookingCancelled = false;

        render(<CancelBookingBanner {...mockProps} />);

        expect(screen.getByTestId('placeholder-contact-us')).toBeInTheDocument();
    });

    it('should call initialize and cleanup on mount/unmount', () => {
        const { unmount } = render(<CancelBookingBanner {...mockProps} />);

        expect(mockStores.holidayCreditStore.initializeCancellation).toHaveBeenCalled();

        unmount();

        expect(mockStores.holidayCreditStore.clearFetchCancellationSummary).toHaveBeenCalled();
    });

    it('should render terms link if cancel button is hidden', () => {
        mockStores.viewBookingStore.booking.amendmentInfo.canBookingCancelled = false;

        render(<CancelBookingBanner {...mockProps} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            link: mockProps.fields!.items[0].fields.TermsAndConditionsLink,
            className: 'ctaLink btn btn--medium',
            dataId: 'terms-cta-link',
            children: mockProps.fields!.items[0].fields.TermsAndConditionsLink.value.text,
        });
    });
});
