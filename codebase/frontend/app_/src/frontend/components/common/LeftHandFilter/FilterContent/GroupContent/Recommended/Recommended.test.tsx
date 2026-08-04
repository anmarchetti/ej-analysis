import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockRecommendedFilter } from 'frontend/__mocks__/filters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import Recommended from './Recommended';

const mockFilterPills = jest.fn();
jest.mock('frontend/components/common/LeftHandFilter/FilterContent/GroupContent/FilterPills/FilterPills', () => ({
    __esModule: true,
    default: props => {
        mockFilterPills(props);

        return <div data-tid='filter-pill' />;
    },
}));

let mockStores;
let mockFilterStore;
const recommendedFilterData = mockRecommendedFilter.options.map(({ filterCode, ...opt }) => ({
    ...opt,
    groupCode: filterCode,
}));

describe('<Recommended />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => false),
                getPreparedGroupContent: jest.fn(() => recommendedFilterData),
                onClear: jest.fn(),
            },
        });
        mockFilterStore = mockStores.searchFiltersStore;
    });

    it('should render FilterPills with correct props', () => {
        render(<Recommended storeInstance={mockFilterStore} />);
        expect(screen.getByTestId('filter-pill')).toBeInTheDocument();

        expect(mockFilterPills).toHaveBeenCalledWith({
            code: FilterGroupCodes.Recommended,
            getLabel: expect.any(Function),
            storeInstance: mockFilterStore,
        });
    });

    describe('getLabel function', () => {
        it('should return name when it exists', () => {
            render(<Recommended storeInstance={mockFilterStore} />);

            const getLabel = mockFilterPills.mock.calls[0][0].getLabel;
            const option = { name: 'Name Label', code: 'code123' };

            expect(getLabel(option)).toBe('Name Label');
        });

        it('should return code when name do not exist', () => {
            render(<Recommended storeInstance={mockFilterStore} />);

            const getLabel = mockFilterPills.mock.calls[0][0].getLabel;
            const option = { code: 'code123' };

            expect(getLabel(option)).toBe('code123');
        });
    });
});
