import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { originsWithNames } from 'frontend/__mocks__/originsWithNames';
import * as utils from 'frontend/utils/filter.utils';
import { MarketCode } from 'models/data/MarketSettings';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IFilterCheckControlProps } from './FilterCheckControl';
import { FilterContent } from './FilterContent';

const mockFilterCheckControl = jest.fn();
jest.mock('./FilterCheckControl', () => ({
    __esModule: true,
    default: props => {
        mockFilterCheckControl(props);

        return <div data-tid='filter-check-control'>{props.label}</div>;
    },
}));

const mockTripadvisorRatingProps = jest.fn();
jest.mock('frontend/components/common/TripadvisorRating/TripadvisorRating', () => ({
    __esModule: true,
    default: props => {
        mockTripadvisorRatingProps(props);

        return <div data-tid='tripadvisor-rating' />;
    },
}));

const allFCCProps = () => mockFilterCheckControl.mock.calls.map(c => c[0] as IFilterCheckControlProps);

describe('FilterContent', () => {
    const resetMocks = () => ({
        availableFilters: [
            {
                code: 'code',
                options: [
                    {
                        code: 'code',
                        count: 2,
                        name: 'name',
                        groupCode: FilterGroupCodes.StarRating,
                    },
                ],
            },
            {
                code: FilterGroupCodes.Flights,
                options: [
                    {
                        code: 'code',
                        count: 2,
                        name: 'name',
                        groupCode: FilterGroupCodes.Flights,
                    },
                ],
            },
            {
                code: FilterGroupCodes.BoardType,
                options: [
                    {
                        code: 'code',
                        count: 2,
                        name: 'name',
                        groupCode: FilterGroupCodes.BoardType,
                    },
                    {
                        code: 'code 1',
                        count: 2,
                        name: 'name 2',
                        groupCode: FilterGroupCodes.BoardType,
                        boardGroup: {
                            code: 'code',
                            name: 'name',
                        },
                    },
                ],
            },
        ],
        activeFilterCode: 'code',
        onApply: jest.fn(),
        onCancel: jest.fn(),
        checkIsFilterSelected: jest.fn(),
        checkIsParentFilterSelected: jest.fn(),
        codeFilters: 'code',
        match: {},
        getPhrase: jest.fn(phrase => phrase),
        getSetting: jest.fn(),
        onSelectFilters: jest.fn(),
        selectedFilters: [],
        status: DataStatus.Loaded,
        selectedDestinationCodesQuery: null,
        getFormattedNumber: jest.fn(number => `${number}`),
        marketCode: MarketCode.UK,
        originsWithNames: originsWithNames,
        ShowFacilityFilterGroupList: [
            'Pool & Beach',
            'Entertainment',
            'Family',
            'General',
            'Sports & Health',
            'Food & Drink',
            'Environmental',
        ],
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render without checkbox when do not have availableFilters', () => {
        mocks.availableFilters = [];

        const { container } = render(<FilterContent {...mocks} />);

        expect(container.querySelector(`#${mocks.codeFilters}`)).toBeInTheDocument();
        expect(screen.queryByTestId('filter-check-control')).not.toBeInTheDocument();
    });

    it('should render with checkbox', () => {
        const { container } = render(<FilterContent {...mocks} />);

        expect(container.querySelector(`#${mocks.codeFilters}`)).toBeInTheDocument();
        expect(screen.queryByTestId('filter-check-control')).toBeInTheDocument();
    });

    it('should render .rating-block if StarRating', () => {
        mocks.codeFilters = FilterGroupCodes.StarRating;

        const { container } = render(<FilterContent {...mocks} />);

        expect(container.querySelectorAll('.rating-block').length).toBe(2);
    });

    it('should have checkbox checked when item is selected', () => {
        mocks.checkIsFilterSelected.mockReturnValue(true);

        render(<FilterContent {...(mocks as any)} />);

        const firstFCC = allFCCProps()[0];

        expect(firstFCC?.checked).toBe(true);
    });

    it('should have checkbox checked when item is not selected and we filtered flights', () => {
        mocks.checkIsFilterSelected.mockReturnValue(false);
        mocks.codeFilters = FilterGroupCodes.Flights;

        render(<FilterContent {...(mocks as any)} />);

        const fcc = allFCCProps().find(p => p.option.groupCode === FilterGroupCodes.Flights);

        expect(fcc?.checked).toBe(true);
    });

    it('should show one checkbox when item is not selected and we filtered board', () => {
        mocks.checkIsFilterSelected.mockReturnValue(false);
        mocks.codeFilters = FilterGroupCodes.BoardType;

        render(<FilterContent {...(mocks as any)} />);

        const fccs = allFCCProps().filter(p => p.option.groupCode === FilterGroupCodes.BoardType);

        expect(fccs).toHaveLength(1);
        expect(fccs[0].checked).toBe(false);
    });

    it('should render stars and trip advisor rating filters', () => {
        mocks.codeFilters = FilterGroupCodes.StarRating;
        mocks.availableFilters = [
            {
                code: FilterGroupCodes.StarRating,
                options: [
                    {
                        code: '5',
                        count: 2,
                        name: 'name',
                        groupCode: FilterGroupCodes.StarRating,
                    },
                ],
            },
            {
                code: FilterGroupCodes.TripAdvisorRating,
                options: [
                    {
                        code: '5',
                        count: 4,
                        name: 'name',
                        groupCode: FilterGroupCodes.TripAdvisorRating,
                    },
                ],
            },
        ];

        render(<FilterContent {...mocks} />);

        expect(screen.getByTestId('stars-label')).toHaveTextContent('(2)');
        expect(mockTripadvisorRatingProps).toHaveBeenCalledWith({
            rating: 5,
        });
        expect(screen.getByTestId('tripadvisor-rating-label')).toHaveTextContent('(4)');
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsOnly)).toBeInTheDocument();
    });

    it('should render stars and trip advisor rating filters', () => {
        const optionChildren = {
            code: 'code',
            count: 2,
            name: 'Entertainment programme',
            groupCode: FilterGroupCodes.Facilities,
        };

        mocks.codeFilters = FilterGroupCodes.Facilities;
        mocks.availableFilters = [
            {
                code: FilterGroupCodes.Facilities,
                options: [
                    {
                        code: '5',
                        count: 2,
                        name: 'Environmental',
                        groupCode: FilterGroupCodes.Facilities,
                        children: [optionChildren],
                    },
                ],
            },
        ];

        render(<FilterContent {...mocks} />);

        expect(screen.getByTestId('facilities')).toBeInTheDocument();
        expect(screen.getByTestId('filter-check-control')).toBeInTheDocument();
        expect(mockFilterCheckControl).toHaveBeenCalledWith({
            checked: undefined,
            disabled: false,
            hiddenZeroCount: true,
            onChange: expect.any(Function),
            option: {
                ...optionChildren,
                tooltipOrientation: CalloutOrientation.Top,
                tooltipPosition: CalloutPosition.IconLeft,
            },
        });
    });

    it('should call mockGetDepartureAirportsWithCountryName', () => {
        const mockGetDepartureAirportsWithCountryName = jest.spyOn(utils, 'getDepartureAirportsWithCountryName');

        render(<FilterContent {...mocks} />);

        expect(mockGetDepartureAirportsWithCountryName).toHaveBeenCalledWith(
            mocks.availableFilters[0].options,
            mocks.originsWithNames,
            mocks.marketCode,
        );
    });

    describe('FilterCheckControl disabled option', () => {
        beforeEach(() => {
            jest.spyOn(utils, 'isExclusiveFilterDisabled').mockReturnValue(false);
            mocks.codeFilters = FilterGroupCodes.HotelTypes;
            mocks.selectedFilters = [{ groupCode: FilterGroupCodes.HotelTypes, isExclusive: true, code: 'code1' }];
            mocks.availableFilters = [
                {
                    code: FilterGroupCodes.HotelTypes,
                    options: [
                        {
                            code: 'code1',
                            name: 'luxury holidays',
                            count: 2,
                            groupCode: FilterGroupCodes.HotelTypes,
                            isExclusive: true,
                        },
                        {
                            code: 'code2',
                            name: 'adult holidays',
                            count: 3,
                            groupCode: FilterGroupCodes.HotelTypes,
                            isExclusive: false,
                        },
                    ],
                },
            ];
        });

        it('should be false when isExclusiveFilterDisabled is false and checkIsFilterDisabled is false', () => {
            render(<FilterContent {...mocks} />);

            expect(mockFilterCheckControl).toHaveBeenCalledWith(
                expect.objectContaining({
                    disabled: false,
                }),
            );
        });

        it('should be true when isExclusiveFilterDisabled is false and checkIsFilterDisabled is true', () => {
            mocks.availableFilters[0].options[0].count = 0;

            render(<FilterContent {...mocks} />);

            expect(mockFilterCheckControl).toHaveBeenCalledWith(
                expect.objectContaining({
                    disabled: true,
                }),
            );
        });

        it('should be true when isExclusiveFilterDisabled is true', () => {
            jest.spyOn(utils, 'isExclusiveFilterDisabled').mockReturnValue(true);

            render(<FilterContent {...mocks} />);

            expect(mockFilterCheckControl).toHaveBeenCalledWith(
                expect.objectContaining({
                    disabled: true,
                }),
            );
        });
    });
});
