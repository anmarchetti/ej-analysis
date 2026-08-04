import { createMockStores } from 'frontend/__mocks__';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import RecentlyUsed from './RecentlyUsed/RecentlyUsed';
import Recommended from './Recommended/Recommended';
import RatingGroup from './StarRatings/RatingGroup';
import Weather from './Weather/Weather';
import BaseCheckboxGroup from './BaseCheckboxGroup';
import Destination from './Destination';
import Facilities from './Facilities';
import FlightDuration from './FlightDuration';
import FlightTimes from './FlightTimes';
import * as utils from './GroupContent.utils';
import PriceFilter from './PriceFilter';

import styles from './yourStyles.module.css';

const { addScrollbarToParentIfNeeded, renderContent } = utils;

const mockStore = new SearchFilterStore(createMockStores());

describe('GroupContent.utils', () => {
    describe('addScrollbarToParentIfNeeded', () => {
        it('should do nothing if el is null', () => {
            const result = addScrollbarToParentIfNeeded(null);

            expect(result).toBeUndefined();
        });

        it('should not add scroll class if el is not a scrollable group', () => {
            const el = {
                id: FilterGroupCodes.Offers,
                parentElement: {
                    classList: {
                        add: jest.fn(),
                    },
                },
                clientHeight: 100,
            };

            addScrollbarToParentIfNeeded(el as any);

            expect(el.parentElement.classList.add).not.toHaveBeenCalled();
        });

        it('should add scroll class if el is a scrollable group', () => {
            const el = {
                id: FilterGroupCodes.Destination,
                parentElement: {
                    classList: {
                        add: jest.fn(),
                    },
                },
                clientHeight: 500,
            };

            addScrollbarToParentIfNeeded(el as any);

            expect(el.parentElement.classList.add).toHaveBeenCalledWith(styles.filterGroupScroll);
        });
    });

    describe('renderContent', () => {
        it('should return the component', () => {
            expect(renderContent(FilterGroupCodes.StarRating, mockStore)).toStrictEqual(
                <RatingGroup storeInstance={mockStore} triggeringCode={FilterGroupCodes.StarRating} />,
            );

            expect(renderContent(FilterGroupCodes.TripAdvisorRating, mockStore)).toStrictEqual(
                <RatingGroup storeInstance={mockStore} triggeringCode={FilterGroupCodes.TripAdvisorRating} />,
            );

            expect(renderContent(FilterGroupCodes.PriceRange, mockStore)).toStrictEqual(<PriceFilter />);

            expect(renderContent(FilterGroupCodes.PackageTheme, mockStore)).toStrictEqual(
                <Destination code={FilterGroupCodes.PackageTheme} storeInstance={mockStore} />,
            );

            expect(renderContent(FilterGroupCodes.Destination, mockStore)).toStrictEqual(
                <Destination code={FilterGroupCodes.Destination} storeInstance={mockStore} />,
            );

            expect(renderContent(FilterGroupCodes.FlightDuration, mockStore)).toStrictEqual(<FlightDuration />);

            expect(renderContent(FilterGroupCodes.Facilities, mockStore)).toStrictEqual(
                <Facilities storeInstance={mockStore} />,
            );

            expect(renderContent(FilterGroupCodes.FlightTimes, mockStore)).toStrictEqual(<FlightTimes />);

            expect(renderContent(FilterGroupCodes.BoardType, mockStore)).toStrictEqual(
                <BaseCheckboxGroup storeInstance={mockStore} code={FilterGroupCodes.BoardType} />,
            );

            expect(renderContent(FilterGroupCodes.Recommended, mockStore)).toStrictEqual(
                <Recommended storeInstance={mockStore} />,
            );
            expect(renderContent(FilterGroupCodes.Recommended, {} as any)).toBeNull();

            expect(renderContent(FilterGroupCodes.RecentlyUsed, mockStore)).toStrictEqual(
                <RecentlyUsed storeInstance={mockStore} />,
            );
            expect(renderContent(FilterGroupCodes.RecentlyUsed, {} as any)).toBeNull();

            expect(renderContent('NON_EXISTED_CODE' as FilterGroupCodes, mockStore)).toBeNull();
            expect(renderContent(FilterGroupCodes.Weather, mockStore)).toStrictEqual(<Weather />);
        });
    });
});
