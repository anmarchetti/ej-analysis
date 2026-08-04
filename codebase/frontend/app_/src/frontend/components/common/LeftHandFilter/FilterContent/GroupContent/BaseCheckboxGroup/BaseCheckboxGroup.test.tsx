import React from 'react';
import { render, screen } from '@testing-library/react';

import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { isLabelHidden } from 'frontend/utils/filter.utils';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import BaseCheckboxGroup from './BaseCheckboxGroup';

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        getSetting: jest.fn(),
    })),
}));

jest.mock('frontend/utils/filter.utils', () => ({
    isLabelHidden: jest.fn().mockReturnValue(false),
}));

const mockFilterCheckControlProps = jest.fn();
jest.mock('./FilterCheckControl', () =>
    jest.fn(props => {
        mockFilterCheckControlProps(props);

        return <div data-tid='filter-check-control'>{props.option.code}</div>;
    }),
);

describe('BaseCheckboxGroup', () => {
    let storeInstance: SearchFilterStore;

    beforeEach(() => {
        storeInstance = {
            onChange: jest.fn(),
            isOptionDisabled: jest.fn(() => false),
            isFilterGroupSelected: jest.fn(() => false),
            getPreparedGroupContent: jest.fn(() => [{ code: 'option1', count: 10 } as IFilterOption]),
            isCountHidden: false,
        } as unknown as SearchFilterStore;
    });

    it('renders correctly', () => {
        render(<BaseCheckboxGroup code={FilterGroupCodes.Duration} storeInstance={storeInstance} />);
        expect(screen.getByTestId('filter-check-control')).toBeInTheDocument();

        expect(mockFilterCheckControlProps).toHaveBeenCalledWith(
            expect.objectContaining({
                option: { code: 'option1', count: 10 },
                checked: false,
                disabled: false,
                isRadioButton: true,
                hideLabelCount: false,
            }),
        );
    });

    it('hides label count based on isCountHidden', () => {
        jest.mocked(isLabelHidden).mockReturnValue(true);
        storeInstance.isCountHidden = true;
        render(<BaseCheckboxGroup code={FilterGroupCodes.Duration} storeInstance={storeInstance} />);
        expect(mockFilterCheckControlProps).toHaveBeenCalledWith(
            expect.objectContaining({
                hideLabelCount: true,
            }),
        );
    });
});
