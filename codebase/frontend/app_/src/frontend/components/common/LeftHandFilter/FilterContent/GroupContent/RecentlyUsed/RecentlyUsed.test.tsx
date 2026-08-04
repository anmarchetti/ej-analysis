import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import RecentlyUsed from './RecentlyUsed';

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
const RecentlyUsedFilterData = [
    {
        code: '5',
        name: '5 stars',
        count: 283,
        groupCode: FilterGroupCodes.StarRating,
    },
    {
        code: '3',
        count: 1,
        name: '3 nights',
        preChecked: false,
        groupCode: FilterGroupCodes.Duration,
    },
];

describe('<RecentlyUsed />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => false),
                getPreparedGroupContent: jest.fn(() => RecentlyUsedFilterData),
                onClear: jest.fn(),
            },
        });
        mockFilterStore = mockStores.searchFiltersStore;
    });

    it('should render FilterPills with correct props', () => {
        render(<RecentlyUsed storeInstance={mockFilterStore} />);
        expect(screen.getByTestId('filter-pill')).toBeInTheDocument();

        expect(mockFilterPills).toHaveBeenCalledWith({
            code: FilterGroupCodes.RecentlyUsed,
            getLabel: expect.any(Function),
            storeInstance: mockFilterStore,
        });
    });

    describe('getLabel function', () => {
        it('should return fullName when it exists', () => {
            render(<RecentlyUsed storeInstance={mockFilterStore} />);

            const getLabel = mockFilterPills.mock.calls[0][0].getLabel;
            const option = { fullName: 'Full Name Label', name: 'Name Label', code: 'code123' };

            expect(getLabel(option)).toBe('Full Name Label');
        });

        it('should return name when fullName does not exist but name exists', () => {
            render(<RecentlyUsed storeInstance={mockFilterStore} />);

            const getLabel = mockFilterPills.mock.calls[0][0].getLabel;
            const option = { name: 'Name Label', code: 'code123' };

            expect(getLabel(option)).toBe('Name Label');
        });

        it('should return code when fullName and name do not exist', () => {
            render(<RecentlyUsed storeInstance={mockFilterStore} />);

            const getLabel = mockFilterPills.mock.calls[0][0].getLabel;
            const option = { code: 'code123' };

            expect(getLabel(option)).toBe('code123');
        });
    });
});
