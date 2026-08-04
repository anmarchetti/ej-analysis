import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ContactUsBanner, { TContactUsBannerProps } from './ContactUsBanner';

const createProps = (): TContactUsBannerProps => ({
    fields: {
        Title: mockSitecoreField('Contact us'),
        CTACloseButtonLabel: mockSitecoreField('close'),
        CTACloseButtonScreenReaderLabel: mockSitecoreField('close button'),
        CTAOpenButtonLabel: mockSitecoreField('open'),
        CTAOpenButtonScreenReaderLabel: mockSitecoreField('open button'),
        CTATitle: mockSitecoreField('Need support? Get in touch'),
        ContactChannels: [],
        ContactChannelsAgency: [
            {
                fields: {
                    Title: mockSitecoreField('Luxury Support'),
                    Description: mockSitecoreField('Luxury support description'),
                },
                id: 'agency-channel-id',
            },
        ],
        ContactChannelsLuxury: [
            {
                fields: {
                    Title: mockSitecoreField('Luxury Support'),
                    Description: mockSitecoreField('Luxury support description'),
                },
                id: 'luxury-channel-id',
            },
        ],
    },
    rendering: {},
    params: {
        ShowButtonOnly: undefined,
    },
});

let props: TContactUsBannerProps;
let mockStores;

const mockPopupComponent = jest.fn();

jest.mock('./components/ContactUsPopup/ContactUsPopup', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockPopupComponent(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

const mockActionCardComponent = jest.fn();

jest.mock('frontend/components/common/ActionCard/ActionCard', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockActionCardComponent(props);

        return <div>{children}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ContactUsBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should open popup button and call a popup with correct props', () => {
        render(<ContactUsBanner {...props} />);

        expect(
            screen.getByRole('button', { name: props.fields!.CTAOpenButtonScreenReaderLabel.value }),
        ).toBeInTheDocument();

        expect(mockPopupComponent).toHaveBeenCalledWith({
            isPopupShown: false,
            ctaCloseButtonLabel: props.fields!.CTACloseButtonLabel,
            ctaCloseButtonScreenReaderLabel: props.fields!.CTACloseButtonScreenReaderLabel,
            title: props.fields!.Title,
            contactChannels: props.fields!.ContactChannels,
            onClose: expect.any(Function),
        });
    });

    it('should open popup button and call a popup with correct props on luxury', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;
        render(<ContactUsBanner {...props} />);

        expect(
            screen.getByRole('button', { name: props.fields!.CTAOpenButtonScreenReaderLabel.value }),
        ).toBeInTheDocument();

        expect(mockPopupComponent).toHaveBeenCalledWith({
            isPopupShown: false,
            ctaCloseButtonLabel: props.fields!.CTACloseButtonLabel,
            ctaCloseButtonScreenReaderLabel: props.fields!.CTACloseButtonScreenReaderLabel,
            title: props.fields!.Title,
            contactChannels: props.fields!.ContactChannelsLuxury,
            onClose: expect.any(Function),
        });
    });

    it('should open popup button and call a popup with correct props on luxury with trade booking', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;
        mockStores.viewBookingStore.booking = {
            isExternalAgency: true,
        };
        render(<ContactUsBanner {...props} />);

        expect(
            screen.getByRole('button', { name: props.fields!.CTAOpenButtonScreenReaderLabel.value }),
        ).toBeInTheDocument();

        expect(mockPopupComponent).toHaveBeenCalledWith({
            isPopupShown: false,
            ctaCloseButtonLabel: props.fields!.CTACloseButtonLabel,
            ctaCloseButtonScreenReaderLabel: props.fields!.CTACloseButtonScreenReaderLabel,
            title: props.fields!.Title,
            contactChannels: props.fields!.ContactChannelsAgency,
            onClose: expect.any(Function),
        });
    });

    it('should open popup button and call a popup with correct props on luxury with trade booking when no contactChannel', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;
        mockStores.viewBookingStore.booking = {
            isExternalAgency: true,
        };
        props.fields!.ContactChannelsAgency = [];
        render(<ContactUsBanner {...props} />);

        expect(
            screen.getByRole('button', { name: props.fields!.CTAOpenButtonScreenReaderLabel.value }),
        ).toBeInTheDocument();

        expect(mockPopupComponent).toHaveBeenCalledWith({
            isPopupShown: false,
            ctaCloseButtonLabel: props.fields!.CTACloseButtonLabel,
            ctaCloseButtonScreenReaderLabel: props.fields!.CTACloseButtonScreenReaderLabel,
            title: props.fields!.Title,
            contactChannels: props.fields!.ContactChannelsLuxury,
            onClose: expect.any(Function),
        });
    });

    it('should render open button and work correctly', async () => {
        render(<ContactUsBanner {...props} />);

        const button = screen.getByRole('button', { name: props.fields!.CTAOpenButtonScreenReaderLabel.value });

        expect(mockPopupComponent).toHaveBeenCalledWith(expect.objectContaining({ isPopupShown: false }));
        await userEvent.click(button);
        expect(mockPopupComponent).toHaveBeenCalledWith(expect.objectContaining({ isPopupShown: true }));
    });

    it('should render the action card component with correct title and iconClassName', () => {
        render(<ContactUsBanner {...props} />);

        expect(mockActionCardComponent).toHaveBeenCalledWith({
            title: props.fields!.CTATitle,
            iconClassName: 'icon',
            icon: expect.anything(),
            dataTid: 'contact-us-banner',
        });
        expect(screen.queryByTestId('contact-us-banner-btn-only')).not.toBeInTheDocument();
    });

    it('should render only button when ShowButtonOnly param is true', () => {
        props.params = {
            ShowButtonOnly: '1',
        };

        render(<ContactUsBanner {...props} />);

        expect(mockActionCardComponent).not.toHaveBeenCalled();
        expect(screen.getByTestId('contact-us-banner-btn-only')).toBeInTheDocument();
    });

    it('should render outlined button by default when ShowButtonOnly param is true', () => {
        props.params = {
            ShowButtonOnly: '1',
        };

        render(<ContactUsBanner {...props} />);

        const button = screen.getByTestId('contact-us-banner-btn-only');
        expect(button).toHaveClass('btn--outlined');
    });

    it('should render non-outlined button when isOutlined is false and ShowButtonOnly param is true', () => {
        props.params = {
            ShowButtonOnly: '1',
        };

        render(<ContactUsBanner {...props} isOutlined={false} />);

        const button = screen.getByTestId('contact-us-banner-btn-only');
        expect(button).not.toHaveClass('btn--outlined');
    });

    it('should NOT render when fields is empty', () => {
        props.fields = undefined;

        const { container } = render(<ContactUsBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when booking is empty', () => {
        mockStores.viewBookingStore.booking = null;

        const { container } = render(<ContactUsBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isCancelledBookingPage is true and booking is NOT from external agency', () => {
        mockStores.viewBookingStore.isCancelledBookingPage = true;
        mockStores.viewBookingStore.booking = {
            isExternalAgency: false,
        };

        const { container } = render(<ContactUsBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render when isCancelledBookingPage is true and booking is from external agency', () => {
        mockStores.viewBookingStore.isCancelledBookingPage = true;
        mockStores.viewBookingStore.booking = {
            isExternalAgency: true,
        };

        render(<ContactUsBanner {...props} />);

        expect(mockActionCardComponent).toHaveBeenCalledWith({
            title: props.fields!.CTATitle,
            iconClassName: 'icon',
            icon: expect.anything(),
            dataTid: 'contact-us-banner',
        });
    });

    it('should NOT render button when CTAOpenButtonLabel is empty', () => {
        props.fields!.CTAOpenButtonLabel = mockSitecoreField('');
        render(<ContactUsBanner {...props} />);

        expect(mockActionCardComponent).toHaveBeenCalled();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
