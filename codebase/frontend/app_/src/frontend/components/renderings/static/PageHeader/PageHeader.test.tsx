import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import { PageHeader } from './PageHeader';

expect.extend(toHaveNoViolations);

let mockStores;

const mockLinkProps = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: props => {
        mockLinkProps(props);

        return <div data-tid='link'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/common/HeaderNavigation/HeaderNavigation', () => ({
    __esModule: true,
    default: () => <div data-tid='header-navigation' />,
}));

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockImageProps(props);

        return <div data-tid='image' />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('PageHeader', () => {
    const resetMocks = () =>
        ({
            fields: {
                MenuAriaLabel: mockSitecoreField('Menu'),
                PrimaryNavigationAriaLabel: mockSitecoreField('PrimaryNavigationAriaLabel'),
                ActionNavigationAriaLabel: mockSitecoreField('ActionNavigationAriaLabel'),
                MainNav: [{ id: '' }],
                SecondaryNav: [{ id: '' }],
                LogoLink: true,
                Logo: {},
            },
            isShowLoginPopup: false,
            toggleReCaptchaBadge: jest.fn(),
            isCheckInAvailable: jest.fn(),
            isConfirmationPage: false,
            isViewBookingPage: false,
            isPaymentPage: false,
            booking: {} as any,
            viewBooking: {} as any,
            clearViewBooking: jest.fn(),
            trackNavigationClick: jest.fn(),
            isMobileAppHideFeatures: false,
        } as any);
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should NOT render when fields are empty', () => {
        mocks.fields = undefined;
        const { container } = render(<PageHeader {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isMobileAppHideFeatures is true', () => {
        mocks.isMobileAppHideFeatures = true;
        const { container } = render(<PageHeader {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render HeaderNavigation when fields are provided and isMobileAppHideFeatures is false', () => {
        render(<PageHeader {...mocks} />);

        expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
    });

    it('should render LogoTag without Link when isPaymentPage is true', () => {
        mocks.isPaymentPage = true;
        render(<PageHeader {...mocks} />);

        expect(screen.queryByTestId('link')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<PageHeader {...mocks} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    it('should render JSSNextImage', async () => {
        mocks.fields.Logo = mockSitecoreField('Logo');
        render(<PageHeader {...mocks} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.fields.Logo,
                width: 166,
                height: 45,
                mediaSize: MediaSize.Small,
            }),
        );

        const link = screen.getByTestId('link').querySelector('a');

        await userEvent.click(link!);

        expect(mocks.clearViewBooking).toHaveBeenCalled();
    });
});
