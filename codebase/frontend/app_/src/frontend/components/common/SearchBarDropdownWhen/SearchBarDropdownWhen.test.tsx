import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SearchBarDropdownWhen, { ISearchBarDropdownWhenProps } from './SearchBarDropdownWhen';

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/SearchPodCalendar',
    () => () => <div data-tid='search-pod-calendar' />,
);

jest.mock('./components/MonthViewDropdown/MonthViewDropdown', () => () => <div data-tid='month-view-dropdown' />);

const mockSearchPodFooterButtonsProps = jest.fn();
jest.mock('frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons', () => {
    const { forwardRef } = jest.requireActual('react');

    return forwardRef((props: any) => {
        mockSearchPodFooterButtonsProps(props);

        return <div data-tid='search-pod-footer-buttons' />;
    });
});

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field, 'data-tid': dataTid, className }) => (
        <div data-tid={dataTid} className={className}>
            {field?.value}
        </div>
    ),
}));

jest.mock('frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox', () => {
    const { forwardRef } = jest.requireActual('react');

    return forwardRef((props: any, ref: any) => (
        <div
            className='search-bar__dropdown-values--scrollable'
            data-tid='search-bar-dropdown-scrollable-box'
            ref={ref}
        >
            {props.children}
        </div>
    ));
});

jest.mock('frontend/utils/date.utils', () => ({
    getCountOfNightLabel: (count: number) => `${count} nights`,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;
let mockLocalStore;
let mockStores;

const createMockProps = (): ISearchBarDropdownWhenProps => ({
    onDropdownClose: jest.fn(),
});

const createLocalStore = () => ({
    fields: {
        DateTabLabel: mockSitecoreField('DateTabLabel'),
        MonthTabLabel: mockSitecoreField('MonthTabLabel'),
        WhenDropdownTitle: mockSitecoreField('WhenDropdownTitle'),
        Duration: mockSitecoreField(7),
    },
});

describe('SearchBarDropdownWhen', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockLocalStore = createLocalStore();
        mockStores = createMockStores({
            searchStore: {
                searchWhen: {
                    setIsMonthSearch: jest.fn(),
                    clearDates: jest.fn(),
                    onChangeFlexible: jest.fn(),
                    isMonthSearch: false,
                    setMonthSearchDuration: jest.fn(),
                    from: null,
                    to: null,
                    selectedNumberOfNights: 3,
                    monthSearchDuration: 10,
                    defaultSearchPodMonthSearchDuration: 7,
                },
            },
            trackingStore: {
                searchPod: {
                    trackWhenFieldTabClick: jest.fn(),
                },
            },
            layoutStore: {
                isMonthSearchEnabled: false,
            },
        });
    });

    it('should render SearchPodCalendar by default when experiment is turned off', () => {
        render(<SearchBarDropdownWhen {...mockProps} />);

        expect(screen.getByTestId('search-pod-calendar')).toBeInTheDocument();
        expect(screen.queryByTestId('month-view-dropdown')).not.toBeInTheDocument();
    });

    describe('when Month Search is turned on', () => {
        beforeEach(() => {
            mockStores.layoutStore.isMonthSearchEnabled = true;
        });

        it('should render SearchPodCalendar by default', () => {
            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(screen.getByTestId('search-pod-calendar')).toBeInTheDocument();
            expect(screen.queryByTestId('month-view-dropdown')).not.toBeInTheDocument();
        });

        it('should render MonthViewDropdown when isMonthSearch is true', () => {
            mockStores.searchStore.searchWhen.isMonthSearch = true;

            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(screen.getByTestId('month-view-dropdown')).toBeInTheDocument();
            expect(screen.queryByTestId('date-view-dropdown')).not.toBeInTheDocument();
        });

        describe('monthTabHandler', () => {
            it('should call expected funcs when click on month tab', () => {
                render(<SearchBarDropdownWhen {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-bar-dropdown-when-month-tab-button'));

                expect(mockStores.searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(true);
                expect(mockStores.searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(
                    mockStores.searchStore.searchWhen.defaultSearchPodMonthSearchDuration,
                );
                expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalledWith(true);
                expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledWith(0);
                expect(mockStores.trackingStore.searchPod.trackWhenFieldTabClick).toHaveBeenCalled();
            });

            it('should call nothing when click on month tab with active month tab', () => {
                mockStores.searchStore.searchWhen.isMonthSearch = true;
                render(<SearchBarDropdownWhen {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-bar-dropdown-when-month-tab-button'));

                expect(mockStores.searchStore.searchWhen.setIsMonthSearch).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWhen.clearDates).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWhen.onChangeFlexible).not.toHaveBeenCalled();
                expect(mockStores.trackingStore.searchPod.trackWhenFieldTabClick).not.toHaveBeenCalled();
            });
        });

        describe('dateTabHandler', () => {
            it('should call expected funcs when click on date tab', () => {
                mockStores.searchStore.searchWhen.isMonthSearch = true;
                render(<SearchBarDropdownWhen {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-bar-dropdown-when-date-tab-button'));

                expect(mockStores.searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(false);
                expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalledWith(true);
                expect(mockStores.trackingStore.searchPod.trackWhenFieldTabClick).toHaveBeenCalled();
            });

            it('should call nothing when click on date tab with active date tab', () => {
                render(<SearchBarDropdownWhen {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-bar-dropdown-when-date-tab-button'));

                expect(mockStores.searchStore.searchWhen.setIsMonthSearch).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWhen.clearDates).not.toHaveBeenCalled();
                expect(mockStores.trackingStore.searchPod.trackWhenFieldTabClick).not.toHaveBeenCalled();
            });
        });

        it('should render without title, with empty buttons when no fields', () => {
            mockLocalStore.fields = {};
            render(<SearchBarDropdownWhen {...mockProps} />);
            expect(screen.getByTestId('search-bar-dropdown-when-title')).toBeEmptyDOMElement();
            expect(screen.getByTestId('search-bar-dropdown-when-date-tab-button')).toBeEmptyDOMElement();
            expect(screen.getByTestId('search-bar-dropdown-when-month-tab-button')).toBeEmptyDOMElement();
        });
    });

    describe('unmount', () => {
        it('should call setIsMonthSearch on unmount when from is empty', () => {
            const { unmount } = render(<SearchBarDropdownWhen {...mockProps} />);

            unmount();

            expect(mockStores.searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(false);
        });

        it('should NOT call setIsMonthSearch on unmount when from is not empty', () => {
            mockStores.searchStore.searchWhen.from = new Date();
            const { unmount } = render(<SearchBarDropdownWhen {...mockProps} />);

            unmount();

            expect(mockStores.searchStore.searchWhen.setIsMonthSearch).not.toHaveBeenCalled();
        });
    });

    describe('SearchPodFooterButtons', () => {
        it('should render buttons for date picker', () => {
            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    applyButtonLabel: SitecoreDictionary.GlobalsButtonsApply,
                    clearButtonLabel: SitecoreDictionary.GlobalsLabelsClearSelection,
                    isShownClearButton: false,
                    onApplyClick: mockProps.onDropdownClose,
                    onCloseClick: mockProps.onDropdownClose,
                    onClearClick: expect.any(Function),
                    isApplyButtonDisabled: true,
                    mobileLabel: `3 nights`,
                    fieldName: SearchBarDropdown.When,
                }),
            );
        });

        it('should pass empty mobile label when only from is selected (0 nights)', () => {
            mockStores.searchStore.searchWhen.selectedNumberOfNights = 0;

            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    mobileLabel: '',
                }),
            );
        });

        it('should render mobile label for month picker', () => {
            mockStores.searchStore.searchWhen.isMonthSearch = true;
            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    mobileLabel: `${mockStores.searchStore.searchWhen.monthSearchDuration} ${SitecoreDictionary.GlobalsLabelsNightsPlural}`,
                }),
            );
        });

        it('should render buttons when January (with index 0) month is selected on month picker', () => {
            mockStores.searchStore.searchWhen.isMonthSearch = true;
            mockStores.searchStore.searchWhen.from = new Date('2025-01-01');
            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isShownClearButton: true,
                    isApplyButtonDisabled: false,
                }),
            );
        });

        it('should disable apply button when only from is selected on date picker', () => {
            mockStores.searchStore.searchWhen.isMonthSearch = false;
            mockStores.searchStore.searchWhen.from = new Date('2025-01-01');
            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isApplyButtonDisabled: true,
                }),
            );
        });

        it('should enable apply button when from & to are selected on date picker', () => {
            mockStores.searchStore.searchWhen.isMonthSearch = false;
            mockStores.searchStore.searchWhen.from = new Date('2025-01-01');
            mockStores.searchStore.searchWhen.to = new Date('2025-01-02');
            render(<SearchBarDropdownWhen {...mockProps} />);

            expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isApplyButtonDisabled: false,
                }),
            );
        });
    });
});
