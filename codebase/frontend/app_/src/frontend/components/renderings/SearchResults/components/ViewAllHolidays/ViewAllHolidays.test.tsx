import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ViewAllHolidays from './ViewAllHolidays';

const createProps = () => ({
    link: 'link',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    searchStore: {
        searchTo: {
            destinationsDisplayValue: { main: 'normal' },
            destinationsParentDisplayValue: { main: 'parent' },
            loadAllDestinations: jest.fn(),
        },
    },
    hotelsStore: { fetchOffers: jest.fn() },
    trackingStore: { searchSortUpdateTrigger: jest.fn() },
    searchFiltersStore: { onClearAllFilters: jest.fn() },
    bookingStore: { grabSearchValuesFromSearchStore: jest.fn() },
});

jest.mock('frontend/components/common/RouterLink', () => ({ children }) => (
    <div data-tid='router-link'>{children}</div>
));

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ViewAllHolidays />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render title', () => {
        const { getByRole } = render(<ViewAllHolidays {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(
            SitecoreDictionary.IframePromotingHolidaysTitlesWhatYouLookedFor,
        );
    });

    it('should render parent destination when is NOT shown in iframe ', () => {
        mockStores.layoutStore.getPhrase = jest.fn(p => `${p} {destination}`);
        const { getByText } = render(<ViewAllHolidays {...mockProps} />);

        expect(
            getByText(`${SitecoreDictionary.IframePromotingHolidaysLabelsViewAllHolidaysForDestination} parent`),
        ).toBeInTheDocument();
    });

    it('should render RouterLink when is NOT shown in iframe ', () => {
        const { getByTestId } = render(<ViewAllHolidays {...mockProps} />);

        expect(getByTestId('router-link')).toHaveTextContent(
            SitecoreDictionary.IframePromotingHolidaysButtonsViewAllHolidays,
        );
    });
});
