import React from 'react';
import { render, screen } from '@testing-library/react';

import { filterPackageIcons } from 'frontend/utils/offer.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import { HolidayCardBody } from './HolidayCardBody';

jest.mock('./components/HolidayPrice/HolidayPrice', () => () => <div data-tid='holiday-price' />);

jest.mock('frontend/utils/offer.utils');
const mockFilterPackageIcons = filterPackageIcons as jest.MockedFn<typeof filterPackageIcons>;

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

jest.mock('./components/HolidayCardFlight/HolidayCardFlight', () => ({ route }: { route: IRoute }) => (
    <div data-tid={`${route.direction}-flight`} />
));

const createProps = () => ({
    hotelLink: '/hotel-url',
    offer: { ...mockIframeOffer },
    shouldShowPrice: true,
    isLuxuryPackage: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidayCardBody />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockFilterPackageIcons.mockImplementation(icons => icons);
    });

    it('should render component', () => {
        render(<HolidayCardBody {...mockProps} />);

        expect(screen.getAllByTestId('jss-next-image')).toHaveLength(
            mockProps.offer.accom?.theme?.packageIcons?.length || 0,
        );

        expect(
            screen.getByRole('link', { name: SitecoreDictionary.IframePromotingHolidaysButtonsViewHoliday }),
        ).toHaveAttribute('href', '/hotel-url');
        expect(screen.getByTestId('hotel-price')).toBeInTheDocument();

        expect(screen.getByTestId('outbound-flight')).toBeInTheDocument();
        expect(screen.getByRole('separator')).toBeInTheDocument();
        expect(screen.getByTestId('inbound-flight')).toBeInTheDocument();

        const link = screen.getByTestId('view-holiday-btn');
        expect(link).toHaveTextContent('IframePromotingHolidays.Buttons.ViewHoliday');
        expect(link).toHaveAttribute('href', '/hotel-url');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
    });

    it('should render no packageIcons and transfers when packageIcons and transfers are NOT provided', () => {
        mockFilterPackageIcons.mockReturnValue([]);

        render(<HolidayCardBody {...mockProps} />);

        expect(screen.queryAllByTestId('jss-next-image')).toHaveLength(0);
    });

    it('should render component without price', () => {
        mockProps.shouldShowPrice = false;

        render(<HolidayCardBody {...mockProps} />);

        expect(screen.queryByTestId('hotel-price')).not.toBeInTheDocument();
    });
});
