import React from 'react';
import { render, screen } from '@testing-library/react';

import * as dates from 'frontend/utils/promoPageDates';
import { DataStatus } from 'models/enum/DataStatus';
import HolidayWithConfidence from 'frontend/components/renderings/HolidayWithConfidence/HolidayWithConfidence';

const createProps = () => ({
    fields: {
        DaysSeparator: { value: '5' },
        Before: {
            id: 3,
            fields: {
                ModuleIcon: { value: { src: 'before icon' } },
                ModuleTitle: { value: 'before title' },
                ModuleText: { value: 'before text' },
                ModuleLinkLabel: { value: 'before label' },
            },
        },
        After: {
            id: 4,
            fields: {
                ModuleIcon: { value: { src: 'after icon' } },
                ModuleTitle: { value: 'after title' },
                ModuleText: { value: 'after text' },
                ModuleLinkLabel: { value: 'after label' },
            },
        },
    },
    searchDepartureDate: new Date(),
    selectedOfferDate: new Date(),
    isFlexible: false,
    isPromoPage: false,
    isHotelDetailsBookPage: false,
    isSearchResultsPage: false,
    offers: [],
    isScreenMedium: false,
    isLoading: false,
});

const createStores = () => ({
    bookingStore: { from: new Date(), departureDate: new Date() },
    searchStore: { searchWhen: { from: new Date(), isFlexible: false } },
    layoutStore: {
        isPromoPage: false,
        isHotelDetailsBookPage: false,
        isSearchResultsPage: false,
    },
    hotelsStore: { offers: [], status: DataStatus.NotLoaded },
    appStore: { isScreenMedium: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HolidayWithConfidence/components/HolidayWithConfidencePopup', () => () => (
    <div data-tid='popup' />
));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<HolidayWithConfidence />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(dates, 'getPromoPageDates').mockReturnValue(null);
    });

    it('Should render component', () => {
        render(<HolidayWithConfidence {...mockProps} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByText('before title')).toBeInTheDocument();
        expect(screen.getByText('before text')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'before label' })).toBeInTheDocument();
        expect(screen.queryByTestId('confidence-module-shimmer')).not.toBeInTheDocument();
    });

    it('Should render shimmer when status is loading', () => {
        mockStores.hotelsStore.status = DataStatus.Loading;
        render(<HolidayWithConfidence {...mockProps} />);

        const shimmer = screen.getByTestId('confidence-module-shimmer');

        expect(shimmer).toBeInTheDocument();
        expect(shimmer).toHaveAttribute('class', 'placeholder-shimmer shimmer');
    });

    it('should NOT render when isHotelDetailsBookPage and no selectedOfferDate', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        mockStores.bookingStore.departureDate = undefined as any;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when is NOT HotelDetailsBookPage and no searchDepartureDate', () => {
        mockStores.bookingStore.from = undefined as any;
        mockStores.searchStore.searchWhen.from = undefined as any;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no fields provided', () => {
        mockProps.fields = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no DaysSeparator provided', () => {
        mockProps.fields.DaysSeparator = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no DaysSeparator value provided', () => {
        mockProps.fields.DaysSeparator.value = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isSearchResultsPage, isFlexible, and no before fields provided', () => {
        mockStores.layoutStore.isSearchResultsPage = true;
        mockStores.searchStore.searchWhen.isFlexible = true;
        mockProps.fields.Before = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isPromoPage and no before fields provided', () => {
        mockStores.layoutStore.isPromoPage = true;
        mockProps.fields.Before = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no searchDepartureDate and no After fields provided', () => {
        mockStores.bookingStore.from = undefined as any;
        mockStores.searchStore.searchWhen.from = undefined as any;
        mockProps.fields.After = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when searchDepartureDate and no Before fields provided', () => {
        mockProps.fields.Before = null;
        const { container } = render(<HolidayWithConfidence {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render Icon', () => {
        render(<HolidayWithConfidence {...mockProps} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields!.Before.fields.ModuleIcon,
                className: 'confidence-module__icon',
                width: 25,
                height: 25,
            }),
        );
    });

    it('should render button when no ModuleLinkLabel value provided', () => {
        mockProps.fields.Before.fields.ModuleLinkLabel.value = null;
        const { queryByRole } = render(<HolidayWithConfidence {...mockProps} />);

        expect(queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render HolidayWithConfidencePopup', () => {
        const { getByTestId } = render(<HolidayWithConfidence {...mockProps} />);

        expect(getByTestId('popup')).toBeInTheDocument();
    });

    describe('before content', () => {
        it('should render Before Module Title', () => {
            const { getByText } = render(<HolidayWithConfidence {...mockProps} />);

            expect(getByText('before title')).toBeInTheDocument();
        });

        it('should render Before Module Text', () => {
            const { getByText } = render(<HolidayWithConfidence {...mockProps} />);

            expect(getByText('before text')).toBeInTheDocument();
        });

        it('should render button in confidence-module__text container when is NOT ScreenMedium', () => {
            const { container, getByRole } = render(<HolidayWithConfidence {...mockProps} />);

            const wrapper = container.getElementsByClassName('confidence-module__text')[0];
            expect(wrapper).toHaveTextContent('before label');
            expect(getByRole('button')).toHaveTextContent('before label');
        });

        it('should render button when isScreenMedium', () => {
            mockStores.appStore.isScreenMedium = true;
            const { container, getByRole } = render(<HolidayWithConfidence {...mockProps} />);

            const wrapper = container.getElementsByClassName('confidence-module__text')[0];
            expect(wrapper).not.toHaveTextContent('before label');
            expect(getByRole('button')).toHaveTextContent('before label');
        });
    });

    describe('after content', () => {
        beforeEach(() => {
            mockProps.fields.DaysSeparator.value = '-1';
            mockStores.bookingStore.departureDate = undefined as any;
        });

        it('should render After Module Title', () => {
            const { getByText } = render(<HolidayWithConfidence {...mockProps} />);

            expect(getByText('after title')).toBeInTheDocument();
        });

        it('should render After Module Text', () => {
            const { getByText } = render(<HolidayWithConfidence {...mockProps} />);

            expect(getByText('after text')).toBeInTheDocument();
        });

        it('should render button in confidence-module__text container when is NOT ScreenMedium', () => {
            const { container, getByRole } = render(<HolidayWithConfidence {...mockProps} />);

            const wrapper = container.getElementsByClassName('confidence-module__text')[0];
            expect(wrapper).toHaveTextContent('after label');
            expect(getByRole('button')).toHaveTextContent('after label');
        });

        it('should render button when isScreenMedium', () => {
            mockStores.appStore.isScreenMedium = true;
            const { container, getByRole } = render(<HolidayWithConfidence {...mockProps} />);

            const wrapper = container.getElementsByClassName('confidence-module__text')[0];
            expect(wrapper).not.toHaveTextContent('after label');
            expect(getByRole('button')).toHaveTextContent('after label');
        });
    });
});
