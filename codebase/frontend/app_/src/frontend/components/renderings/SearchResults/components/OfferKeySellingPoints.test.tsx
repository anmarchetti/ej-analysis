import React from 'react';
import { render } from '@testing-library/react';

import { IBoardType } from 'models/data/IHotel';
import { HolidayThemes } from 'models/enum/HolidayThemes';

import { IOfferKeySellingPointsProps, OfferKeySellingPoints } from './OfferKeySellingPoints';

const resetMocks = (): IOfferKeySellingPointsProps => ({
    holidayType: {
        code: '',
        name: '',
        itemName: '',
        description: '',
        icon: '',
    },
    holidayTheme: {
        code: '',
        name: '',
        packageIcons: [],
    },
    closestFacility: null,
    layout: {
        sitecore: {
            context: {
                pageEditing: false,
            },
        },
    },
    getPhrase: jest.fn(),
    boardTypes: {
        title: '',
    } as IBoardType,
    roomTypes: {
        title: '',
    } as any,
    getFormattedNumber: jest.fn(number => `${number}`),
});

describe('<OfferKeySellingPoints />', () => {
    let mocks: IOfferKeySellingPointsProps;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render without closestFacility and holiday theme', () => {
        const { container } = render(<OfferKeySellingPoints {...mocks} />);
        expect(container.querySelectorAll('.list-item--icon')).toHaveLength(0);
    });

    it('should render without closestFacility', () => {
        const { container } = render(<OfferKeySellingPoints {...mocks} />);
        expect(container.querySelectorAll('.list-item--icon')).toHaveLength(0);
    });

    it('should render with closestFacility with replaceTokens', () => {
        mocks.closestFacility = {
            name: 'Beach',
            distance: 300,
            code: 'code',
            groupCode: 'groupCode',
        };
        mocks.holidayTheme = {
            code: HolidayThemes.Beach,
        } as any;
        mocks.getPhrase = jest.fn(() => '{facility}: {distance}');
        mocks.getFormattedNumber = jest.fn(() => '0.3');

        const { container, getByText } = render(<OfferKeySellingPoints {...mocks} />);
        expect(container.querySelectorAll('.list-item--icon')).toHaveLength(1);
        expect(getByText('Beach: 0.3')).toBeInTheDocument();
    });

    it('should render with closestFacility', () => {
        mocks.closestFacility = {
            name: 'Beach',
            distance: 100,
            code: 'code',
            groupCode: 'groupCode',
        };
        mocks.holidayTheme = {
            code: HolidayThemes.Beach,
        } as any;
        mocks.getPhrase = jest.fn(() => 'text {distance}');
        mocks.layout.sitecore.context.pageEditing = true;

        const { container, getByText } = render(<OfferKeySellingPoints {...mocks} />);
        expect(container.querySelectorAll('.list-item--icon')).toHaveLength(1);
        expect(getByText('text {distance}')).toBeInTheDocument();
    });
});
