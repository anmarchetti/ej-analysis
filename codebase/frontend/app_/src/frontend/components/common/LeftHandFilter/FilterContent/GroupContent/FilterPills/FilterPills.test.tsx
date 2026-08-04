import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockFilterOutboundDepartureTime, mockRecommendedFilter } from 'frontend/__mocks__/filters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import { FilterPills, IFilterPillsProps } from './FilterPills';

const mockCheckbox = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: ({ onChange, dataTid, ...props }) => {
        mockCheckbox(props);

        return <button onClick={onChange} data-tid={dataTid} />;
    },
}));

jest.mock('frontend/utils/filter.utils', () => ({
    getFilterOptionByCode: jest.fn().mockReturnValue(mockRecommendedFilter.options[0]),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () =>
    createMockStores({
        trackingStore: {
            trackSearchFiltersUpdate: jest.fn(),
        },
    });

let mockStores;
let mockProps: IFilterPillsProps;
const recommendedFilterData = mockRecommendedFilter.options.map(({ filterCode, ...opt }) => ({
    ...opt,
    groupCode: filterCode,
}));

const createMockProps = (): IFilterPillsProps => ({
    code: FilterGroupCodes.Recommended,
    getLabel: (option): string => option.name || option.code,
    storeInstance: createMockStores({
        searchFiltersStore: {
            onChange: jest.fn(),
            isOptionDisabled: jest.fn(() => false),
            isFilterGroupSelected: jest.fn(() => false),
            getPreparedGroupContent: jest.fn(() => recommendedFilterData),
            onClear: jest.fn(),
            filters: [mockRecommendedFilter, mockFilterOutboundDepartureTime],
        },
    }).searchFiltersStore,
});

describe('<FilterPills />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createMockProps();
    });

    it('should render wrapper div with correct class', () => {
        const { container } = render(<FilterPills {...mockProps} />);
        expect(container.firstChild).toHaveClass('wrapper');
    });

    it('should render nothing when content is empty', () => {
        mockProps.storeInstance.getPreparedGroupContent = jest.fn(() => []);
        const { container } = render(<FilterPills {...mockProps} />);
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('should render checkboxes for each prepared option', () => {
        render(<FilterPills {...mockProps} />);
        expect(mockCheckbox).toHaveBeenCalledTimes(recommendedFilterData.length);
    });

    it('should pass correct props to Checkbox', () => {
        mockProps.storeInstance.isFilterGroupSelected = jest.fn(() => true);
        mockProps.storeInstance.isOptionDisabled = jest.fn(() => true);
        render(<FilterPills {...mockProps} />);

        const calls = mockCheckbox.mock.calls;
        calls.forEach(call => {
            const props = call[0];
            expect(props).toHaveProperty('className');
            expect(props).toHaveProperty('checkedClassName');
            expect(props).toHaveProperty('disabled');
            expect(props).toHaveProperty('checked');
            expect(props).toHaveProperty('isPillStyle', true);
            expect(props).toHaveProperty('medium', true);
        });
    });

    it('should call onChange when checkbox is clicked for normal options', async () => {
        const user = userEvent.setup();
        render(<FilterPills {...mockProps} />);

        const buttons = screen.getAllByTestId('boardType-recommended-option');
        await user.click(buttons[0]);

        expect(mockProps.storeInstance.onChange).toHaveBeenCalledTimes(1);
        expect(mockProps.storeInstance.onChange).toHaveBeenCalledWith(
            recommendedFilterData[0],
            FilterGroupCodes.Recommended,
        );
        expect(mockProps.storeInstance.onClear).not.toHaveBeenCalled();
    });

    it('should call onClear instead of onChange for Duration when selected', async () => {
        mockProps.storeInstance.isFilterGroupSelected = jest.fn(() => true);

        render(<FilterPills {...mockProps} />);

        const durationButton = screen.getByTestId('duration-recommended-option');

        expect(durationButton).toBeInTheDocument();

        await userEvent.click(durationButton);
        expect(mockProps.storeInstance.onClear).toHaveBeenCalledWith(FilterGroupCodes.Duration);
        expect(mockStores.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(
            false,
            expect.objectContaining({ groupCode: FilterGroupCodes.Duration }),
            FilterGroupCodes.Recommended,
        );
        expect(mockProps.storeInstance.onChange).not.toHaveBeenCalled();
    });

    it('should call onClear instead of onChange for TripAdvisorRating when selected', async () => {
        mockProps.storeInstance.isFilterGroupSelected = jest.fn(() => true);

        render(<FilterPills {...mockProps} />);

        const taButton = screen.getByTestId('tripAdvisorRating-recommended-option');

        expect(taButton).toBeInTheDocument();

        await userEvent.click(taButton);
        expect(mockProps.storeInstance.onClear).toHaveBeenCalledWith(FilterGroupCodes.TripAdvisorRating);
        expect(mockStores.trackingStore.trackSearchFiltersUpdate).toHaveBeenCalledWith(
            false,
            expect.objectContaining({ groupCode: FilterGroupCodes.TripAdvisorRating }),
            FilterGroupCodes.Recommended,
        );
        expect(mockProps.storeInstance.onChange).not.toHaveBeenCalled();
    });

    it('should call isOptionDisabled with correct parameters', () => {
        render(<FilterPills {...mockProps} />);

        expect(mockProps.storeInstance.isOptionDisabled).toHaveBeenCalled();
        const calls = (mockProps.storeInstance.isOptionDisabled as jest.Mock).mock.calls;
        calls.forEach(call => {
            expect(call).toHaveLength(3); // count, groupCode, option
        });
    });

    it('should call isFilterGroupSelected with correct option', () => {
        render(<FilterPills {...mockProps} />);

        expect(mockProps.storeInstance.isFilterGroupSelected).toHaveBeenCalled();
        const calls = (mockProps.storeInstance.isFilterGroupSelected as jest.Mock).mock.calls;
        calls.forEach(call => {
            expect(call).toHaveLength(1);
            expect(call[0]).toHaveProperty('groupCode');
        });
    });

    it('should include disabled classname when option is disabled', () => {
        mockProps.storeInstance.isOptionDisabled = jest.fn(() => true);
        render(<FilterPills {...mockProps} />);

        const calls = mockCheckbox.mock.calls;
        calls.forEach(call => {
            const props = call[0];
            expect(props.className).toContain('disabled');
        });
    });

    it('should not include disabled classname when option is not disabled', () => {
        mockProps.storeInstance.isOptionDisabled = jest.fn(() => false);
        render(<FilterPills {...mockProps} />);

        const calls = mockCheckbox.mock.calls;
        calls.forEach(call => {
            const props = call[0];
            expect(props.className).not.toContain('disabled');
        });
    });
});
