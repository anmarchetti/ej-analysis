import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { deepClone } from 'frontend/utils/array.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CompareOption } from 'models/data/IComparison';

import DynamicCell, { IDynamicRowsProps } from './DynamicCell';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => () => (
    <div data-tid='trip-advisor-info' />
));

jest.mock('frontend/components/common/StarRating', () => () => <div data-tid='star-ratings' />);

jest.mock('./components/Mapper', () => ({ dataTid }) => <div data-tid={dataTid} />);

let mockGetBagsData;
jest.mock('./DynamicCell.utils', () => ({
    getDates: () => '12 Sep - 19 Sep',
    getFlightTime: (_, direction) => (direction === 0 ? '07:25 - 12:00' : '19:10 - 23:20'),
    getStayData: () => '4 nights',
    getBagsData: () => mockGetBagsData,
    getFacilityData: () => [],
    getTransferName: () => 'transfer name',
}));

jest.mock('frontend/utils/string.utils', () => ({
    roomTitleNormalize: title => title,
}));

let mockDistanceInfo = '200 m to nearest beach';
jest.mock('frontend/utils/getHotelLocation', () => ({
    distanceInfo: () => mockDistanceInfo,
    distanceTextFromSitecore: jest.fn(),
}));

const offer = deepClone({ ...mockedOffer, extraLuggageInfo: { items: [] } });
offer.accom.unit[0].boardType.title = 'All inclusive';
offer.accom.unit[0].roomType.title = 'Sea view';

const createMockProps = (): IDynamicRowsProps => ({
    option: CompareOption.TripAdvisor,
    offer,
    FallbackLabel: mockSitecoreField('—'),
    MissingDataLabel: mockSitecoreField(''),
});

let mockStores;
let mockProps;

describe('DynamicCells', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            shortlistStore: {
                isOfferFromAnotherMarket: jest.fn(() => false),
            },
        });
        mockProps = createMockProps();
        mockGetBagsData = [];
    });

    describe('should return right data for option', () => {
        it(`should render mapper with Bags data-tid for Bags`, () => {
            mockProps.option = CompareOption.Bags;
            mockGetBagsData = ['str'];
            render(<DynamicCell {...mockProps} />);

            expect(screen.getByTestId(CompareOption.Bags)).toBeInTheDocument();
        });

        describe.each([
            [CompareOption.TripAdvisor, 'trip-advisor-info'],
            [CompareOption.CustomerRating, 'star-ratings'],
            [CompareOption.Facilities, CompareOption.Facilities],
        ])('components', (option, componentTId) => {
            it(`should render ${componentTId} for ${option}`, () => {
                mockProps.option = option;
                render(<DynamicCell {...mockProps} />);

                expect(screen.getByTestId(componentTId)).toBeInTheDocument();
            });
        });

        describe.each([
            [CompareOption.Dates, '12 Sep - 19 Sep'],
            [CompareOption.Duration, '4 nights'],
            [CompareOption.DepartureAirport, `London Gatwick`],
            [CompareOption.OutboundFlightTime, '07:25 - 12:00'],
            [CompareOption.ReturnFlightTime, '19:10 - 23:20'],
            [CompareOption.BoardType, 'All inclusive'],
            [CompareOption.RoomType, 'Sea view'],
            [CompareOption.TransferType, 'transfer name'],
            [CompareOption.Location, '200 m to nearest beach'],
        ])('string values', (option, result) => {
            it(`should return ${result} for ${option}`, () => {
                mockProps.option = option;
                render(<DynamicCell {...mockProps} />);

                expect(screen.getByText(result)).toBeInTheDocument();
            });
        });
    });

    describe('should return fallback string for missed values', () => {
        it('when value is an empty string', () => {
            mockProps.option = CompareOption.Location;
            mockDistanceInfo = '';
            render(<DynamicCell {...mockProps} />);

            expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
        });

        it('for CustomerRating component', () => {
            mockProps.option = CompareOption.CustomerRating;
            mockProps.offer.hotel.starRating = undefined;
            render(<DynamicCell {...mockProps} />);

            expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
        });

        it('for TripAdvisor component', () => {
            mockProps.option = CompareOption.TripAdvisor;
            mockProps.offer.hotel.rating = undefined;
            render(<DynamicCell {...mockProps} />);

            expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
        });

        it('for RoomType component', () => {
            mockProps.option = CompareOption.RoomType;
            mockProps.offer.accom.unit[0].roomType.title = undefined;
            render(<DynamicCell {...mockProps} />);

            expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
        });

        it('for Bags', () => {
            mockProps.option = CompareOption.Bags;
            render(<DynamicCell {...mockProps} />);

            expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
        });

        describe('for TransferType', () => {
            it('should return fallback label', () => {
                render(<DynamicCell {...mockProps} />);

                expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
            });
        });
    });

    it('should render fallback for unexpected value', () => {
        mockProps.option = 'test';

        render(<DynamicCell {...mockProps} />);

        expect(screen.getByText(mockProps.FallbackLabel.value)).toBeInTheDocument();
    });

    it('should render missing label', () => {
        mockProps.option = CompareOption.BoardType;
        mockProps.MissingDataLabel.value = 'No board type selected';
        mockProps.offer.accom.unit[0].boardType.title = undefined;
        render(<DynamicCell {...mockProps} />);

        expect(screen.getByText(mockProps.MissingDataLabel.value)).toBeInTheDocument();
    });
});
