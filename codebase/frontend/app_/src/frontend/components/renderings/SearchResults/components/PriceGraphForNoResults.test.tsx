import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceGraphForNoResults from './PriceGraphForNoResults';

const createProps = () => ({
    togglePriceGraphVisible: jest.fn(),
    selectedDate: new Date(2023, 6, 12),
    loadAlternativeOffers: jest.fn(),
    destinationsDisplayValue: { main: 'main' },
    setDestinationsDisplayValue: jest.fn(),
    isScreenMedium: false,
    middleDate: new Date(2023, 7, 12),
    resetSelectedOffer: jest.fn(),
    holidayDuration: 2,
    priceGraphVisible: false,
    getPhrase: jest.fn(p => p),
});

const createStores = () => ({
    priceGraphStore: {
        loadAlternativeOffers: jest.fn(),
        middleDate: new Date(2023, 6, 12),
        priceGraphPopupVisible: false,
    },
    bookingStore: { destinationsDisplayValue: { main: 'main' }, setDestinationsDisplayValue: jest.fn() },
    appStore: { isScreenMedium: false },
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/PriceGraph/PriceGraph', () => () => <div data-tid='price-graph' />);

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    formatDateL10n: jest.fn(),
}));

describe('<PriceGraphForNoResults />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render title', () => {
        const { getByRole } = render(<PriceGraphForNoResults {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.PriceGraphLabelsSingleSearchNoResultsFound);
    });

    it('should render title with destinationsDisplayValue main', () => {
        // @ts-ignore
        mockStores.layoutStore.getPhrase = jest.fn(() => '{name} test');
        const { getByRole } = render(<PriceGraphForNoResults {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('main test');
    });

    it('should NOT render selected dates when activateDate is equal to selectedDate', () => {
        const { container } = render(<PriceGraphForNoResults {...mockProps} />);

        expect(container.getElementsByClassName('price-graph-widget__selected-dates').length).toBe(0);
    });

    it('should render selected dates when activateDate is NOT equal to selectedDate', () => {
        const { container, getByText, rerender } = render(<PriceGraphForNoResults {...mockProps} />);
        mockProps.selectedDate = new Date(2023, 6, 13);

        rerender(<PriceGraphForNoResults {...mockProps} />);

        expect(container.getElementsByClassName('price-graph-widget__selected-dates').length).toBe(1);
        expect(
            getByText(
                `${formatDateL10n(new Date(2023, 6, 12), DATE_FORMATS.fullDate)} - ${formatDateL10n(
                    new Date(2023, 6, 14),
                    DATE_FORMATS.fullDate,
                )}`,
            ),
        ).toBeInTheDocument();
    });

    it('should render selected dates with PriceGraphLabelsHolidayDates when activateDate is NOT equal to selectedDate and screen is medium', () => {
        mockStores.appStore.isScreenMedium = true;
        const { getByText, rerender } = render(<PriceGraphForNoResults {...mockProps} />);
        mockProps.selectedDate = new Date(2023, 6, 13);

        rerender(<PriceGraphForNoResults {...mockProps} />);

        expect(getByText(SitecoreDictionary.PriceGraphLabelsHolidayDates)).toBeInTheDocument();
    });

    it('should render PriceGraph', () => {
        const { getByTestId } = render(<PriceGraphForNoResults {...mockProps} />);

        expect(getByTestId('price-graph')).toBeInTheDocument();
    });

    it('should render button', () => {
        const { getByRole } = render(<PriceGraphForNoResults {...mockProps} />);

        expect(getByRole('button')).toHaveTextContent(SitecoreDictionary.PriceGraphButtonsApply);
    });

    it('should NOT call resetSelectedOffer when active date is equal to selected date', async () => {
        const { getByRole } = render(<PriceGraphForNoResults {...mockProps} />);

        const button = getByRole('button');
        await userEvent.click(button);
        expect(mockProps.resetSelectedOffer).not.toHaveBeenCalled();
    });

    it('should call resetSelectedOffer when active date is NOT equal to selected date', async () => {
        const { getByRole, rerender } = render(<PriceGraphForNoResults {...mockProps} />);
        mockProps.selectedDate = new Date(2023, 6, 13);

        rerender(<PriceGraphForNoResults {...mockProps} />);

        const button = getByRole('button');
        await userEvent.click(button);
        expect(mockProps.resetSelectedOffer).toHaveBeenCalled();
    });
});
