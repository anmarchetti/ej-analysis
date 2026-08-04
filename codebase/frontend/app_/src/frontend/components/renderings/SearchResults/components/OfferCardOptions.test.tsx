import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as hotelLocationUtils from 'frontend/utils/getHotelLocation';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import * as urgencyMessageUtils from 'frontend/utils/urgencyMessage.utils';
import { IBoardType, IClosestFacility, IRoomType } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IOfferCardOptionsProps, OfferCardOptions } from './OfferCardOptions';

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: props => {
        mockPillComponent(props);

        return <div data-tid='pill' />;
    },
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: () => <div data-tid='jss-image' />,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(),
}));

const mockOtherRoutesProps = jest.fn();
jest.mock('./other-routes/OtherRoutes', () => ({
    __esModule: true,
    default: props => {
        mockOtherRoutesProps(props);

        return <div data-tid='other-routes' />;
    },
}));

jest.mock('frontend/utils/shortlist.utils', () => ({
    __esModule: true,
    isShortlistOfferUnavailable: jest.fn(() => false),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IOfferCardOptionsProps => ({
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy.PriceHightToLow,
    alternativeFlightsSortOrders: [
        {
            label: 'default code',
            value: 'default sort',
        },
        {
            label: 'default code 1 ',
            value: 'default sort 1',
        },
    ],
    holidayType: {
        code: 'test',
        name: 'test',
        description: 'test',
        icon: 'test',
    },
    holidayTheme: {
        code: 'test',
        name: 'test',
        packageIcons: [],
    },
    closestFacility: {
        code: 'code closest facility',
        distance: 1,
        groupCode: 'group code',
        name: 'name closest facility',
    } as IClosestFacility,
    getPhrase: jest.fn(p => p),
    boardType: {
        name: 'test',
    } as IBoardType,
    roomType: {
        name: 'test',
    } as IRoomType,
    routeArr: {
        arrDate: '2019-09-16T14:20:00+00:00',
        arrName: 'Palma Airport',
        arrPt: 'PMI',
        depDate: '2019-09-16T11:55:00+00:00',
        depName: 'London Gatwick Airport',
        depPt: 'LGW',
    } as IRoute,
    routeDep: {
        depDate: '2019-09-16T14:20:00+00:00',
        depName: 'Palma Airport',
        depPt: 'PMI',
        arrDate: '2019-09-16T11:55:00+00:00',
        arrName: 'London Gatwick Airport',
        arrPt: 'LGW',
    } as IRoute,
    night: 7,
    offer: {} as IOffer,
    marketCode: 'UK',
    isShortlistPage: false,
    isScreenLessMedium: false,
    wasRerendered: true,
    isAlternativeBoardsEnabled: false,
    isPromoPage: false,
    pageName: 'page',
    isApplySpecialFilter: jest.fn(() => true),
    getFormattedNumber: jest.fn(),
    isUrgencyMessageVisible: true,
    isABVariantTest: false,
    getSetting: jest.fn(),
    isHotelDetailsBookPage: false,
});

let props;
let mockStores;

describe('<OfferCardOptions />', () => {
    const getUrgencyMessage = jest.spyOn(urgencyMessageUtils, 'getRoomsUrgencyMessage');

    beforeEach(() => {
        mockStores = createMockStores();
        props = createProps();
    });

    it('should standard render', () => {
        render(<OfferCardOptions {...props} />);

        expect(screen.getByTestId('departure-airport')).toBeInTheDocument();
    });

    it('should render without closestFacility', () => {
        render(<OfferCardOptions {...props} />);

        expect(screen.queryByTestId('distance')).not.toBeInTheDocument();
    });

    it('should show 6 items on Desktop view', () => {
        const { container } = render(<OfferCardOptions {...props} />);

        expect(container.querySelectorAll('.holiday-details__item')).toHaveLength(6);
    });

    it('should show 4 items on Mobile view', () => {
        props.isScreenLessMedium = true;

        const { container } = render(<OfferCardOptions {...props} />);

        expect(container.querySelectorAll('.holiday-details__item')).toHaveLength(4);
    });

    it('should render pill on Desktop on UK', () => {
        const message = 'message';
        getUrgencyMessage.mockReturnValueOnce(message);

        props.isScreenLessMedium = false;

        render(<OfferCardOptions {...props} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(2);
        expect(mockPillComponent).toHaveBeenNthCalledWith(1, {
            contentClass: 'urgentPillContent priority',
            icon: expect.any(Object),
            text: SitecoreDictionary.SearchResultsLabelsHurryTooltip,
            title: message,
        });
    });

    it('should NOT render pill on Mobile on UK', () => {
        props.isScreenLessMedium = true;

        render(<OfferCardOptions {...props} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(1);
        expect(mockPillComponent).not.toHaveBeenCalledWith({
            contentClass: 'urgentPillContent',
        });
    });

    it('should NOT render pill on Desktop on EUX', () => {
        props.isScreenLessMedium = false;
        props.marketCode = 'FR';

        render(<OfferCardOptions {...props} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(1);
        expect(mockPillComponent).not.toHaveBeenCalledWith({
            contentClass: 'urgentPillContent',
        });
    });

    it('should NOT render pill on Mobile on EUX', () => {
        props.isScreenLessMedium = true;
        props.marketCode = 'FR';

        render(<OfferCardOptions {...props} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(1);
        expect(mockPillComponent).not.toHaveBeenCalledWith({
            contentClass: 'urgentPillContent',
        });
    });

    it('should render pill on Desktop on EUX with AB Test', () => {
        const message = 'message';
        getUrgencyMessage.mockReturnValueOnce(message);

        props.isScreenLessMedium = false;
        props.marketCode = 'FR';
        props.isABVariantTest = true;

        render(<OfferCardOptions {...props} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(2);
        expect(mockPillComponent).toHaveBeenNthCalledWith(1, {
            contentClass: 'urgentPillContent priority',
            icon: expect.any(Object),
            text: SitecoreDictionary.SearchResultsLabelsHurryTooltip,
            title: message,
        });
    });

    it('should NOT render pill on Mobile on EUX with AB Test', () => {
        props.isScreenLessMedium = true;
        props.marketCode = 'FR';
        props.isABVariantTest = true;

        render(<OfferCardOptions {...props} />);

        expect(screen.getAllByTestId('pill')).toHaveLength(1);
        expect(mockPillComponent).not.toHaveBeenCalledWith({
            contentClass: 'urgentPillContent',
        });
    });

    it('should render other routes when not in promo page and other routes length > 1', () => {
        props.offer && (props.offer.otherRoutes = ['BRS', 'LTN']);

        render(<OfferCardOptions {...props} />);

        expect(screen.getByTestId('other-routes')).toBeInTheDocument();
    });

    it('should NOT render other routes when other routes length <= 1', () => {
        props.offer && (props.offer.otherRoutes = undefined);

        render(<OfferCardOptions {...props} />);

        expect(screen.queryByTestId('other-routes')).not.toBeInTheDocument();
    });

    it('should NOT render other routes when in promo page, isApplySpecialFilter returns true and other routes length > 1', () => {
        props.offer && (props.offer.otherRoutes = ['BRS', 'LTN']);
        props.isPromoPage = true;

        render(<OfferCardOptions {...props} />);

        expect(screen.queryByTestId('other-routes')).not.toBeInTheDocument();
    });

    it('should render other routes when in promo page, isApplySpecialFilter returns false and other routes length > 1', () => {
        props.offer && (props.offer.otherRoutes = ['BRS', 'LTN']);
        props.isPromoPage = true;
        props.isApplySpecialFilter = jest.fn(() => false);

        render(<OfferCardOptions {...props} />);

        expect(screen.getByTestId('other-routes')).toBeInTheDocument();
        expect(mockOtherRoutesProps).toHaveBeenCalledWith({
            alternativeFlightsDefaultSort: props.alternativeFlightsDefaultSort,
            alternativeFlightsSortOrders: props.alternativeFlightsSortOrders,
            offer: props.offer,
        });
    });

    describe('renderHotelShortlistDetails', () => {
        it('should be rendered when isShortlistHotelType is true', () => {
            props.isShortlistHotelType = true;
            jest.spyOn(hotelLocationUtils, 'distanceInfo').mockReturnValue('distanceText');

            render(<OfferCardOptions {...props} />);

            expect(screen.getByTestId('holiday-type')).toHaveClass('holiday-details__item');
            expect(screen.getByTestId('distance')).toHaveClass('holiday-details__item');

            expect(screen.queryByTestId('departure-airport')).not.toBeInTheDocument();
            expect(screen.queryByTestId('arrival-airport')).not.toBeInTheDocument();
            expect(screen.queryByTestId('holiday-dates')).not.toBeInTheDocument();
        });

        it('should NOT be rendered when isShortlistHotelType is false', () => {
            props.isShortlistHotelType = false;
            jest.spyOn(hotelLocationUtils, 'distanceInfo').mockReturnValue('distanceText');

            render(<OfferCardOptions {...props} />);

            expect(screen.queryByTestId('distance')).not.toBeInTheDocument();

            expect(screen.queryByTestId('departure-airport')).toBeInTheDocument();
            expect(screen.queryByTestId('arrival-airport')).toBeInTheDocument();
            expect(screen.queryByTestId('holiday-dates')).toBeInTheDocument();
        });
    });

    it('should NOT show formatted date and total nights on mobile when isShortlistOfferUnavailable is true', () => {
        props.isShortlistPage = true;
        props.isScreenLessMedium = true;
        (isShortlistOfferUnavailable as jest.Mock).mockReturnValueOnce(true);

        render(<OfferCardOptions {...props} />);
        expect(screen.getByText(props.routeDep.depName)).toBeInTheDocument();
    });
});
