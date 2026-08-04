import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IDestinationCarouselCard } from 'models/data/IDestinationCarousel';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import DestinationsCarousel, { SelectionMode } from './DestinationsCarousel';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockFilterOption = { destinationInfo: { type: 'Region' } };
jest.mock('frontend/utils/filter.utils', () => ({
    findFilterOptionByCode: jest.fn(() => mockFilterOption),
}));

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='carousel'>{children}</div>,
}));

const mockDestinationCardComponent = jest.fn();
jest.mock('frontend/components/renderings/DestinationsCarousel/DestinationCard/DestinationCard', () => ({
    __esModule: true,
    default: props => {
        mockDestinationCardComponent(props);

        return (
            <div
                id={props.Code.value}
                data-tid='destination-card'
                onClick={() =>
                    props.onSelectDestination({
                        code: props.Code.value,
                        name: props.Name.value,
                        position: props.position,
                        category: props.destinationType,
                    })
                }
            >
                DestinationCard
            </div>
        );
    },
}));

const mockSitecoreDestinationCardFields = ({
    code,
    name,
    type,
}: {
    code: string;
    name: string;
    type: string;
}): ISitecoreCompositeField<IDestinationCarouselCard> => ({
    id: name,
    url: `/${name}`,
    fields: {
        Name: mockSitecoreField(name),
        Code: mockSitecoreField(code),
        Image: mockSitecoreField(mockSitecoreImageField('Image')),
        KSPs: [
            {
                id: 'ksp1',
                fields: {
                    KSP: mockSitecoreField(type),
                    Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
                },
            },
        ],
        PageCategory: mockSitecoreField(type),
    },
});

const createStores = () =>
    createMockStores({
        searchStore: {
            searchTo: {
                countriesWithRegions: [{ name: 'Spain', children: [{ code: 'ESBA' }] }],
            },
            setSeachPerformWithNewParams: jest.fn(),
            setPageNumber: jest.fn(),
            setPrevPageNumber: jest.fn(),
        },
        layoutStore: { basePath: '/' },
        appStore: { isScreenLarge: true },
        routerStore: { clearIsClickBackToSearch: jest.fn() },
        hotelsStore: { fetchOffers: jest.fn() },
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
        searchFiltersStore: {
            allDestinationFilters: [
                {
                    code: 'FR',
                    groupCode: 'destination',
                    destinationInfo: { type: 'Country' },
                    name: 'France',
                    children: [
                        {
                            code: 'FRPA',
                            groupCode: 'destination',
                            destinationInfo: { type: 'Region' },
                            name: 'Paris',
                        },
                    ],
                },
                { code: 'NLAM', groupCode: 'destination', destinationInfo: { type: 'Region' }, name: 'Amsterdam' },
                { code: 'ESBA', groupCode: 'destination', destinationInfo: { type: 'Region' }, name: 'Barcelona' },
            ],
            onSelectFilters: jest.fn(),
            isFilterGroupSelected: jest.fn(),
            selectedFilters: [],
            onChangeSearchFilterStore: jest.fn(),
        },
    });

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Destinations: [
            mockSitecoreDestinationCardFields({ code: 'ESBA', name: 'Barcelona', type: 'region' }),
            mockSitecoreDestinationCardFields({ code: 'NLAM', name: 'Amsterdam', type: 'region' }),
            mockSitecoreDestinationCardFields({ code: 'FRPA', name: 'Paris', type: 'region' }),
            mockSitecoreDestinationCardFields({ code: 'FR', name: 'France', type: 'country' }),
        ],
    },
    params: {} as any,
    rendering: {} as any,
});

let mockStores;
let mockProps;

describe('DestinationsCarousel', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('Should render component', () => {
        render(<DestinationsCarousel {...mockProps} />);

        expect(screen.getByTestId('destination-carousel')).toBeInTheDocument();
    });

    it('Should not render component', () => {
        mockProps.fields.Destinations = [];
        render(<DestinationsCarousel {...mockProps} />);

        expect(screen.queryByTestId('destination-carousel')).not.toBeInTheDocument();
    });

    it('Should render title', () => {
        render(<DestinationsCarousel {...mockProps} />);

        expect(screen.getByText(mockProps.fields.Title.value)).toBeInTheDocument();
    });

    it('Should render Destinations items', () => {
        render(<DestinationsCarousel {...mockProps} />);

        expect(screen.getAllByTestId('destination-card').length).toEqual(mockProps.fields.Destinations.length);
        mockProps.fields.Destinations.forEach((element, index) => {
            expect(mockDestinationCardComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    Code: element.fields.Code,
                    Image: element.fields.Image,
                    KSPs: element.fields.KSPs,
                    Name: element.fields.Name,
                    PageCategory: element.fields.PageCategory,
                    position: `${index + 1}`,
                    onSelectDestination: expect.any(Function),
                }),
            );
        });
    });

    it('Should select Destination card and update filters when clicking on Destination item', async () => {
        render(<DestinationsCarousel {...mockProps} />);

        await userEvent.click(screen.getAllByTestId('destination-card')[0]);

        expect(mockStores.searchFiltersStore.onSelectFilters).toHaveBeenCalled();
        expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
            key: 'filtersChanged',
            value: true,
        });
    });

    it('Should deselect previously selected filter after clicking on the second Destination card', async () => {
        mockStores.searchFiltersStore.selectedFilters = [
            { code: 'ESBA', groupCode: 'destination', destinationInfo: { type: 'Region' }, name: 'Barcelona' },
        ];
        render(<DestinationsCarousel {...mockProps} />);
        const cards = screen.getAllByTestId('destination-card');

        expect(cards.length).toBe(mockProps.fields.Destinations.length);

        await userEvent.click(cards[0]);
        expect(mockStores.searchFiltersStore.onSelectFilters).toHaveBeenCalledTimes(1);

        await userEvent.click(cards[1]);
        expect(mockStores.searchFiltersStore.onSelectFilters).toHaveBeenCalledTimes(3);
    });

    it('Should select all children of the dectination when country Destination card is clicking', async () => {
        const countryFilter = mockStores.searchFiltersStore.allDestinationFilters[0];
        mockFilterOption = countryFilter;
        render(<DestinationsCarousel {...mockProps} />);

        const countryCard = screen.getAllByTestId('destination-card').find(card => card.getAttribute('id') === 'FR');

        await userEvent.click(countryCard!);
        expect(mockStores.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith(
            expect.objectContaining({ children: countryFilter.children }),
            true,
        );
    });

    it('Should track all destinations selected via filters in single selection mode, not just the clicked one', async () => {
        mockStores.searchFiltersStore.selectedFilters = [
            { code: 'NLAM', groupCode: 'destination', destinationInfo: { type: 'Region' }, name: 'Amsterdam' },
        ];
        render(<DestinationsCarousel {...mockProps} />);

        const countryCard = screen.getAllByTestId('destination-card').find(card => card.getAttribute('id') === 'ESBA');

        await userEvent.click(countryCard!);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.PromoDestinationCarousel,
                eventAction: EventActions.CardSelected,
                eventLabel: 'Barcelona',
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            {
                genericValue1: '2|1',
                genericValue2: `${mockProps.fields.Destinations.length}`,
                genericValue3: SelectionMode.Single,
                genericValue4: 'Amsterdam|Barcelona',
            },
        );
    });

    it('Should track only one clicked destination in single selection mode when card is selected', async () => {
        render(<DestinationsCarousel {...mockProps} />);

        const countryCard = screen.getAllByTestId('destination-card').find(card => card.getAttribute('id') === 'ESBA');

        await userEvent.click(countryCard!);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.PromoDestinationCarousel,
                eventAction: EventActions.CardSelected,
                eventLabel: 'Barcelona',
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            {
                genericValue1: '1',
                genericValue2: `${mockProps.fields.Destinations.length}`,
                genericValue3: SelectionMode.Single,
                genericValue4: 'Barcelona',
            },
        );
    });

    it('Should track only one clicked destination in single selection mode when card is deselected', async () => {
        mockStores.searchFiltersStore.isFilterGroupSelected = jest.fn(() => true);
        render(<DestinationsCarousel {...mockProps} />);

        const countryCard = screen.getAllByTestId('destination-card').find(card => card.getAttribute('id') === 'ESBA');

        await userEvent.click(countryCard!);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.PromoDestinationCarousel,
                eventAction: EventActions.CardDeselected,
                eventLabel: 'Barcelona',
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            {
                genericValue1: '1',
                genericValue2: `${mockProps.fields.Destinations.length}`,
                genericValue3: SelectionMode.Single,
                genericValue4: 'Barcelona',
            },
        );
    });
});
