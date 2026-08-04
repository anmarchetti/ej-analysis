import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';

import { createMockStores } from 'frontend/__mocks__';
import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SiteSettings from 'models/enum/SiteSettings';

import MonthViewDropdown from './MonthViewDropdown';

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock(
    'frontend/components/common/SearchBarDropdownWhen/components/MonthViewDropdown/components/MonthViewDisclaimers/MonthViewDisclaimers',
    () => ({
        __esModule: true,
        default: ({ cheapestMonthTestId }) => <div data-tid={cheapestMonthTestId} />,
    }),
);

jest.mock('frontend/components/common/SearchBarDropdownWhen/components/MonthCarousel/MonthCarousel', () => ({
    __esModule: true,
    default: ({ months, onMonthChange }) => (
        <div data-tid='carousel'>
            {months.map(month => (
                <input
                    key={`${month.monthName}-${month.year}`}
                    type='radio'
                    name='month-option'
                    onChange={() => onMonthChange(month)}
                    data-tid={`${month.monthName}-${month.year}-input`}
                />
            ))}
        </div>
    ),
}));

jest.mock('frontend/components/common/SearchBarDropdownWhen/components/MonthOption/MonthOption', () => ({
    __esModule: true,
    default: ({ onMonthChange, month }) => (
        <input
            type='radio'
            name='month-option'
            onChange={onMonthChange}
            data-tid={`${month.monthName}-${month.year}-input`}
        />
    ),
}));

const mockedDurationValue = 7;
jest.mock('frontend/components/common/SearchBarDropdownWhen/components/DurationPills/DurationPills', () => ({
    __esModule: true,
    default: ({ onChange }) => <button data-tid='duration-pills' onClick={() => onChange(mockedDurationValue)} />,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockLocalStore;
let mockStores;
let settings;

const createLocalStore = () => ({
    fields: {
        DurationLabel: { value: '{duration} nights duration' },
    },
});

const createSettings = () => ({
    [SiteSettings.SearchPodDurationPillOptions]: [
        {
            Duration: '7',
            Label: '7 days',
        },
        {
            Duration: '10',
            Label: '10 days',
        },
    ],
});

describe('MonthViewDropdown', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockLocalStore = createLocalStore();
        mockStores = createMockStores({
            searchStore: {
                searchWhen: {
                    lastAvailableDate: new Date('2026-10-31T00:00:00'),
                    onChangeDates: jest.fn(),
                    setMonthSearchDuration: jest.fn(),
                    requestAvailableMonths: jest.fn(),
                    monthSearchDuration: 7,
                    monthsAvailability: mockMonthsAvailability,
                    cheapestMonthList: [
                        {
                            month: 2,
                            price: 133,
                            searchStartDate: '2025-12-23',
                            year: 2025,
                        },
                    ],
                    defaultSearchPodMonthSearchDuration: 7,
                    updateAvailableDates: jest.fn(),
                    clearDates: jest.fn(),
                    from: null,
                },
            },
            trackingStore: {
                searchPod: {
                    trackWhenDropdownSelection: jest.fn(),
                },
            },
            layoutStore: {
                isSearchPodMonthDurationPillsEnabled: false,
                getSetting: jest.fn(key => settings[key]),
            },
        });
        settings = createSettings();
    });

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2025-07-01'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should render title', () => {
        render(<MonthViewDropdown />);

        expect(
            screen.getByText(
                `${mockLocalStore.fields.DurationLabel.value} ${mockStores.searchStore.searchWhen.monthSearchDuration}`,
            ),
        ).toBeInTheDocument();

        expect(screen.getByTestId('month-dropdown')).toBeInTheDocument();
    });

    it('should render without crashing when Duration and DurationLabel are undefined', () => {
        mockLocalStore.fields = {};

        render(<MonthViewDropdown />);

        expect(screen.getByTestId('month-view-duration')).toBeEmptyDOMElement();
    });

    it('should NOT render title when no fields', () => {
        mockLocalStore.fields = {};
        render(<MonthViewDropdown />);

        expect(screen.getByTestId('month-view-duration')).toBeEmptyDOMElement();
    });

    it('should show all months', () => {
        render(<MonthViewDropdown />);

        expect(screen.getAllByRole('radio')).toHaveLength(16);
        expect(screen.getByTestId('July-2025-input')).toBeInTheDocument();
    });

    it('should render all months up to the lastAvailableDate if monthsAvailability is empty', () => {
        mockStores.searchStore.searchWhen.monthsAvailability = [];
        mockStores.searchStore.searchWhen.lastAvailableDate = new Date('2025-10-31T00:00:00');

        render(<MonthViewDropdown />);

        expect(screen.getAllByRole('radio')).toHaveLength(4);
        expect(screen.getByTestId('July-2025-input')).toBeInTheDocument();
        expect(screen.getByTestId('October-2025-input')).toBeInTheDocument();
    });

    it('should call onChangeDates and trackWhenDropdownSelection on month click', () => {
        render(<MonthViewDropdown />);

        fireEvent.click(screen.getByTestId('February-2026-input'));

        expect(mockStores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([
            new Date('2026-02-01T00:00:00.000Z'),
            new Date('2026-02-28T23:59:59.999Z'),
        ]);
        expect(mockStores.searchStore.searchWhen.setMonthSearchDuration).not.toHaveBeenCalled();
        expect(mockStores.trackingStore.searchPod.trackWhenDropdownSelection).toHaveBeenCalled();
    });

    it('should call with the corresponding year from searchWhen.from field onChangeDates and trackWhenDropdownSelection on month click', () => {
        mockStores.searchStore.searchWhen.from = new Date('2026-02-01');
        render(<MonthViewDropdown />);

        fireEvent.click(screen.getByTestId('April-2026-input'));

        expect(mockStores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([
            new Date('2026-04-01T00:00:00.000Z'),
            new Date('2026-04-30T23:59:59.999Z'),
        ]);
        expect(mockStores.trackingStore.searchPod.trackWhenDropdownSelection).toHaveBeenCalled();
    });

    it('should call setMonthSearchDuration with default sitecore value on month click, when current stored value doesn’t match any of the duration pill options', () => {
        mockStores.searchStore.searchWhen.monthSearchDuration = 35;
        mockStores.layoutStore.isSearchPodMonthDurationPillsEnabled = true;
        render(<MonthViewDropdown />);

        fireEvent.click(screen.getByTestId('February-2026-input'));

        expect(mockStores.searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(
            mockStores.searchStore.searchWhen.defaultSearchPodMonthSearchDuration,
        );
        expect(screen.getByTestId('month-wrapper')).toHaveClass('monthsWrapper withDurationPills');
    });

    it('should call setMonthSearchDuration on month click when month search duration from sitecore is not equal with current store value', () => {
        mockStores.searchStore.searchWhen.monthSearchDuration = 10;
        render(<MonthViewDropdown />);

        fireEvent.click(screen.getByTestId('February-2026-input'));

        expect(mockStores.searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(
            mockStores.searchStore.searchWhen.defaultSearchPodMonthSearchDuration,
        );
    });

    it('should render carousel', () => {
        render(<MonthViewDropdown />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
    });

    it('should render all months without carousel on mobile', () => {
        mockUseMobileViewport = true;
        render(<MonthViewDropdown />);

        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();

        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(mockMonthsAvailability.length);
    });

    describe('Month View Disclaimers', () => {
        it('should NOT render the Month View Disclaimers when isCheapestMonthPriceEnabled is false and has cheapest price', () => {
            render(<MonthViewDropdown />);

            expect(screen.queryByTestId('cheapest-month-description')).not.toBeInTheDocument();
        });

        it('should NOT render the Month View Disclaimers when isCheapestMonthPriceEnabled is true and cheapestMonthList is undefined', () => {
            mockStores.layoutStore.isCheapestMonthPriceEnabled = true;
            mockStores.searchStore.searchWhen.cheapestMonthList = undefined;

            render(<MonthViewDropdown />);

            expect(screen.queryByTestId('cheapest-month-description')).not.toBeInTheDocument();
        });

        it('should render Month View Disclaimers with desktop testId when isCheapestMonthPriceEnabled is true and has cheapest price', () => {
            mockStores.layoutStore.isCheapestMonthPriceEnabled = true;

            render(<MonthViewDropdown />);

            expect(screen.getByTestId('cheapest-month-description')).toBeInTheDocument();
            expect(screen.queryByTestId('cheapest-month-description-mobile')).not.toBeInTheDocument();
        });

        it('should render Month View Disclaimers with mobile testId when isCheapestMonthPriceEnabled is true, has cheapest price and useMobileViewport is true', () => {
            mockStores.layoutStore.isCheapestMonthPriceEnabled = true;
            mockUseMobileViewport = true;

            render(<MonthViewDropdown />);

            expect(screen.queryByTestId('cheapest-month-description')).not.toBeInTheDocument();
            expect(screen.getByTestId('cheapest-month-description-mobile')).toBeInTheDocument();
        });
    });

    it('should render the mobile cheapest month description when isCheapestMonthPriceEnabled is true, has cheapest price and useMobileViewport is true', () => {
        mockStores.layoutStore.isCheapestMonthPriceEnabled = true;
        mockUseMobileViewport = true;

        render(<MonthViewDropdown />);

        expect(screen.queryByTestId('cheapest-month-description')).not.toBeInTheDocument();
        expect(screen.getByTestId('cheapest-month-description-mobile')).toBeInTheDocument();
    });

    it('should call setMonthSearchDuration and updateAvailableDates on duration pill click', () => {
        mockStores.layoutStore.isSearchPodMonthDurationPillsEnabled = true;
        render(<MonthViewDropdown />);

        fireEvent.click(screen.getByTestId('duration-pills'));

        expect(mockStores.searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(mockedDurationValue);
        expect(mockStores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
    });

    describe('clear dates effect on monthsAvailability change', () => {
        it('should not call clearDates when from is not set', () => {
            mockStores.searchStore.searchWhen.from = null;
            const { rerender } = render(<MonthViewDropdown />);

            mockStores.searchStore.searchWhen.monthsAvailability = [...mockMonthsAvailability];
            rerender(<MonthViewDropdown />);

            expect(mockStores.searchStore.searchWhen.clearDates).not.toHaveBeenCalled();
        });

        it('should NOT call clearDates when from is set and the matching month still has availability', () => {
            const from = new Date('2026-02-01');
            mockStores.searchStore.searchWhen.from = from;
            const { rerender } = render(<MonthViewDropdown />);

            mockStores.searchStore.searchWhen.monthsAvailability = [...mockMonthsAvailability];
            rerender(<MonthViewDropdown />);

            expect(mockStores.searchStore.searchWhen.clearDates).not.toHaveBeenCalled();
        });

        it('should call clearDates when from has no corresponding entry in monthsAvailability', () => {
            const from = new Date('2030-01-01');
            mockStores.searchStore.searchWhen.from = from;
            const { rerender } = render(<MonthViewDropdown />);

            mockStores.searchStore.searchWhen.monthsAvailability = [...mockMonthsAvailability];
            rerender(<MonthViewDropdown />);

            expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalled();
        });

        it('should call clearDates already on mount when from is set but matching month has no availability', () => {
            const from = new Date('2026-02-01');
            mockStores.searchStore.searchWhen.from = from;
            mockStores.searchStore.searchWhen.monthsAvailability = mockMonthsAvailability.map(month =>
                dayjs(month.date).isSame(dayjs(from), 'month') ? { ...month, availability: false } : month,
            );

            render(<MonthViewDropdown />);

            expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalled();
        });
    });
});
