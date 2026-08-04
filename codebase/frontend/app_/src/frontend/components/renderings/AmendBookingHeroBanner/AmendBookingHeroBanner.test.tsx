import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockAmendDatesStore } from 'frontend/__mocks__';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import AmendBookingHeroBannerVariants from 'models/enum/AmendBookingHeroBannerVariants';
import SitePath from 'models/enum/SitePath';

import AmendBookingHeroBanner from './AmendBookingHeroBanner';

expect.extend(toHaveNoViolations);

const createStores = () => ({
    layoutStore: {
        getBreadcrumb: jest.fn(v => v),
        isAmendTransfersPage: true,
        getPhrase: jest.fn(),
        currentPath: SitePath.PassengerDetails,
    },
    routerStore: {
        pathname: 'pathname',
    },
    amendTransfersStore: {
        upgradePrice: 10.01,
        isAmendPriceEnabledOnChangeTransferPage: true,
        scenario: AmendScenarios.FromBooking,
        isFromBooking: true,
    },
    amendDatesStore: mockAmendDatesStore,
    appStore: { isScreenLessMedium: false },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    amendFlightsStore: { scenario: AmendScenarios.FromBooking },
});

const createProps = () => ({
    fields: {
        Image: { value: { src: 'src' } },
        Name: { value: 'Name' },
        Subtitle: { value: 'Subtitle' },
        PageDescription: { value: 'Description' },
    },
});

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('../DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: () => <div data-tid='destination-breadcrumbs'>Breadcrumb</div>,
}));

describe('<AmendBookingHeroBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe('upgradePrice rendering', () => {
        it('Should render upgradePrice from amend transfer flow', () => {
            render(<AmendBookingHeroBanner {...props} />);

            expect(screen.getByTestId('upgrade-price-banner')).toHaveTextContent('£11');
        });

        it('Should render upgradePrice from amend dates transfer flow', () => {
            mockStores.amendTransfersStore.isFromBooking = false;
            render(<AmendBookingHeroBanner {...props} />);

            expect(screen.getByTestId('upgrade-price-banner')).toHaveTextContent('£30');
        });

        it('Should NOT render upgradePrice when it is less then 0', () => {
            mockStores.amendTransfersStore.upgradePrice = -12;
            render(<AmendBookingHeroBanner {...props} />);

            expect(screen.queryByTestId('upgrade-price-banner')).not.toBeInTheDocument();
        });

        it('Should NOT render upgradePrice when it is 0', () => {
            mockStores.amendTransfersStore.upgradePrice = 0;
            render(<AmendBookingHeroBanner {...props} />);

            expect(screen.queryByTestId('upgrade-price-banner')).not.toBeInTheDocument();
        });
    });

    it('Should render component if there are available fields', () => {
        const { container } = render(<AmendBookingHeroBanner {...props} />);
        const banner = container.querySelector('.amend-hero-banner');
        const textBlock = container.querySelector('.amend-hero-banner__text');

        expect(banner).toBeInTheDocument();
        expect(textBlock).toBeInTheDocument();
    });

    it('Should not render component if there are no available fields', () => {
        delete props.fields;

        const { container } = render(<AmendBookingHeroBanner {...props} />);

        const banner = container.querySelector('.amend-hero-banner');
        expect(banner).not.toBeInTheDocument();
    });

    it('Should render translucent bottom banner variant if it was set', () => {
        props.params = { Variant: AmendBookingHeroBannerVariants.TranslucentWhiteStripe };
        const { container } = render(<AmendBookingHeroBanner {...props} />);
        const banner = container.querySelector('.amend-hero-banner.amend-hero-banner--translucent-stripe');

        expect(banner).toBeInTheDocument();
    });

    it('Should render default view banner if the variant is not TranslucentWhiteStripe and there should not be line/description block', () => {
        props.params = { Variant: 'default' };
        const { container } = render(<AmendBookingHeroBanner {...props} />);
        const banner = container.querySelector('.amend-hero-banner.amend-hero-banner--gradient-overlay');

        expect(banner).toBeInTheDocument();
    });

    it('Should not render subtitle if Subtitle field is empty', () => {
        const { container } = render(<AmendBookingHeroBanner {...props} />);
        const banner = container.querySelector('.amend-hero-banner .amend-hero-banner__subtitle');

        expect(banner).toBeInTheDocument();

        delete props.fields.Subtitle;
        const { container: rerenderedWrapper } = render(<AmendBookingHeroBanner {...props} />);
        const noTitleBanner = rerenderedWrapper.querySelector('.amend-hero-banner .amend-hero-banner__subtitle');

        expect(noTitleBanner).not.toBeInTheDocument();
    });

    it('Should not render title if Name field is empty', () => {
        const { container } = render(<AmendBookingHeroBanner {...props} />);
        const banner = container.querySelector('.amend-hero-banner .amend-hero-banner__title');
        expect(banner).toBeInTheDocument();

        delete props.fields.Name;
        const { container: rerenderedWrapper } = render(<AmendBookingHeroBanner {...props} />);
        const noTitleBanner = rerenderedWrapper.querySelector('.amend-hero-banner .amend-hero-banner__title');
        expect(noTitleBanner).not.toBeInTheDocument();
    });

    it('Should render null for price', () => {
        mockStores.layoutStore.isAmendTransfersPage = false;
        const { container } = render(<AmendBookingHeroBanner {...props} />);

        const price = container.querySelector('.amend-hero-banner__price');

        expect(price).not.toBeInTheDocument();
    });

    it('Should render null for breadcrumbs', () => {
        mockStores.layoutStore.currentPath = SitePath.ViewBooking;
        const { container } = render(<AmendBookingHeroBanner {...props} />);

        const breadcrumbs = container.querySelector('.amend-hero-banner__placeholder-top');

        expect(breadcrumbs).not.toBeInTheDocument();
    });

    it('Should render mobile image', () => {
        mockStores.appStore.isScreenLessMedium = true;
        const { container } = render(<AmendBookingHeroBanner {...props} />);

        const image = container.querySelector('.amend-hero-banner__image');

        expect(image?.getAttribute('style')).toBe('background-image: url(src?mw=800&mh=500);');
    });

    it('Should not render breadcrumbs if in change dates flight change journey', () => {
        mockStores.amendFlightsStore.scenario = AmendScenarios.FromChangeDate;

        render(<AmendBookingHeroBanner {...props} />);

        expect(screen.queryByTestId('destination-breadcrumbs')).not.toBeInTheDocument();
    });

    it('Should not render breadcrumbs if in change dates transfer change journey', () => {
        mockStores.amendTransfersStore.scenario = AmendScenarios.FromChangeDate;

        render(<AmendBookingHeroBanner {...props} />);

        expect(screen.queryByTestId('destination-breadcrumbs')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendBookingHeroBanner {...props} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render aria-label', () => {
            render(<AmendBookingHeroBanner {...props} />);

            expect(screen.getByTestId('change-flights-text')).toHaveAttribute('aria-label', 'Name');
        });
    });
});
