import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ContactUsPopup, { IContactUsPopupProps } from './ContactUsPopup';

expect.extend(toHaveNoViolations);

const createProps = (): IContactUsPopupProps => ({
    title: mockSitecoreField('Contact us'),
    ctaCloseButtonLabel: mockSitecoreField('close'),
    ctaCloseButtonScreenReaderLabel: mockSitecoreField('close button'),
    isPopupShown: true,
    onClose: jest.fn(),
    contactChannels: [
        {
            fields: {
                Description: mockSitecoreField('Description'),
                Title: mockSitecoreField('Title'),
                OpenChatBot: mockSitecoreField(false),
                Key: mockSitecoreField('unique-key'),
            },
            id: '1',
        },
    ],
});

let props: IContactUsPopupProps;
let mockStores;
let mockIsMobileViewport = false;

const mockFloatingPopupComponent = jest.fn();
const mockContactUsChannelComponent = jest.fn();

jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: ({ children, footerContent, ...props }) => {
        mockFloatingPopupComponent(props);

        return (
            <div data-tid='floating-popup'>
                {children}
                {footerContent}
            </div>
        );
    },
}));

jest.mock('frontend/components/renderings/ContactUsBanner/components/ContactUsChannel/ContactUsChannel', () => ({
    __esModule: true,
    default: props => {
        mockContactUsChannelComponent(props);

        return <div data-tid='contact-us-channel' />;
    },
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobileViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ContactUsPopup />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                isInDestinationPage: false,
            },
        });
        mockIsMobileViewport = false;
    });

    it('should NOT render when open is false', () => {
        props.isPopupShown = false;

        const { container } = render(<ContactUsPopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call FloatingPopup with correct props', () => {
        render(<ContactUsPopup {...props} />);

        expect(mockFloatingPopupComponent).toHaveBeenCalledWith({
            onClose: props.onClose,
            containerClass: 'container',
            hasFooterShadow: false,
            footerClass: 'footer',
        });
    });

    it('should call FloatingPopup with hasFooterShadow prop true when mobile and in Destination page', () => {
        mockIsMobileViewport = true;
        mockStores.viewBookingStore.isInDestinationPage = true;

        render(<ContactUsPopup {...props} />);

        expect(mockFloatingPopupComponent).toHaveBeenCalledWith({
            onClose: props.onClose,
            containerClass: 'container',
            hasFooterShadow: true,
            footerClass: 'footer',
        });
    });

    it('should render title inside popup', () => {
        render(<ContactUsPopup {...props} />);

        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(props.title.value);
        expect(screen.getByTestId('contact-us-popup-title')).toBeInTheDocument();
    });

    it('should NOT render contact us channel if channel`s country codes do not have booking`s country code', () => {
        props.contactChannels = [
            {
                fields: {
                    Description: mockSitecoreField('Description'),
                    DisplayCountries: mockSitecoreField('RA ND OM'),
                    Title: mockSitecoreField('Title'),
                    OpenChatBot: mockSitecoreField(false),
                    Key: mockSitecoreField('Key'),
                },
                id: '1',
            },
        ];

        render(<ContactUsPopup {...props} />);

        expect(screen.queryByTestId('contact-us-channel')).not.toBeInTheDocument();
    });

    it('should NOT filter channel if country codes is empty string', () => {
        render(<ContactUsPopup {...props} />);

        expect(screen.getAllByTestId('contact-us-channel')).toHaveLength(props.contactChannels.length);
    });

    it('should call ContactUsChannel with correct props', () => {
        render(<ContactUsPopup {...props} />);

        expect(mockContactUsChannelComponent).toHaveBeenCalledWith({
            fields: props.contactChannels[0].fields,
            onClose: expect.any(Function),
        });
    });

    it('should call expected funcs when click on close button', async () => {
        render(<ContactUsPopup {...props} />);

        await userEvent.click(screen.getByRole('button', { name: props.ctaCloseButtonScreenReaderLabel.value }));

        expect(props.onClose).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ContactUsPopup {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
