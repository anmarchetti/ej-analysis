import React from 'react';
import { render, screen } from '@testing-library/react';

import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { IFilters } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import AnimatedWrapper from 'frontend/components/common/AnimatedWrapper/AnimatedWrapper';
import GroupContent from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent';
import GroupTitle from 'frontend/components/common/LeftHandFilter/FilterContent/GroupTitle';

import FilterContentElement from './FilterContentElement';

import '@testing-library/jest-dom';

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/GroupTitle', () =>
    jest.fn(() => <div data-tid='group-title' />),
);

jest.mock('frontend/components/common/AnimatedWrapper/AnimatedWrapper', () =>
    jest.fn(({ children }) => <div data-tid='animated-wrapper'>{children}</div>),
);

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/GroupContent', () =>
    jest.fn(() => <div data-tid='group-content' />),
);

describe('FilterContentElement', () => {
    let storeInstance: SearchFilterStore;
    let group: IFilters;

    beforeEach(() => {
        storeInstance = {
            onClear: jest.fn(),
            onTitleClick: jest.fn(),
            isFilterGroupActive: jest.fn().mockReturnValue(false),
            isFilterGroupDisabled: jest.fn().mockReturnValue(false),
            countableFilters: [],
        } as unknown as SearchFilterStore;

        group = { code: FilterGroupCodes.BoardType, name: FilterGroupCodes.BoardType, options: [] };
    });

    it('should render GroupTitle with correct props', () => {
        render(<FilterContentElement storeInstance={storeInstance} group={group} />);
        const groupTitle = screen.getByTestId('group-title');

        expect(groupTitle).toBeInTheDocument();
        expect(GroupTitle).toHaveBeenCalledWith(
            expect.objectContaining({
                code: group.code,
                countableFilters: storeInstance.countableFilters,
                isActive: false,
                isDisabled: false,
                onClick: storeInstance.onTitleClick,
                onRemoveAllFilterGroup: storeInstance.onClear,
            }),
            {},
        );
    });

    it('should render AnimatedWrapper with correct props', () => {
        render(<FilterContentElement storeInstance={storeInstance} group={group} />);
        const animatedWrapper = screen.getByTestId('animated-wrapper');

        expect(animatedWrapper).toBeInTheDocument();
        expect(AnimatedWrapper).toHaveBeenCalledWith(
            expect.objectContaining({
                isShown: false,
                entranceClass: 'isOpen',
                exitClass: 'isClosed',
            }),
            {},
        );
    });

    it('should render GroupContent with correct props', () => {
        render(<FilterContentElement storeInstance={storeInstance} group={group} />);
        const groupContent = screen.getByTestId('group-content');

        expect(groupContent).toBeInTheDocument();
        expect(GroupContent).toHaveBeenCalledWith(
            expect.objectContaining({
                storeInstance,
                code: group.code,
            }),
            {},
        );
    });

    it('should handle active and disabled states correctly', () => {
        storeInstance.isFilterGroupActive = jest.fn().mockReturnValue(true);
        storeInstance.isFilterGroupDisabled = jest.fn().mockReturnValue(false);

        render(<FilterContentElement storeInstance={storeInstance} group={group} />);

        expect(GroupTitle).toHaveBeenCalledWith(
            expect.objectContaining({
                isActive: true,
                isDisabled: false,
            }),
            {},
        );
        expect(AnimatedWrapper).toHaveBeenCalledWith(
            expect.objectContaining({
                isShown: true,
            }),
            {},
        );
    });
});
