import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { extraLuggageInfoMock, mockDefaultBags } from 'frontend/__mocks__/extraLuggage';
import * as utils from 'frontend/utils/luggage.utils';
import luggageInfoFieldsMocks from 'frontend/components/common/Booking/LuggageInfo/__mocks__/LuggageInfoFields';

import { HolidaySummaryBags, IHolidaySummaryBagsProps } from './HolidaySummaryBags';

expect.extend(toHaveNoViolations);

const createProps = (): IHolidaySummaryBagsProps => ({
    dataTid: 'test-tid',
    luggageInfo: extraLuggageInfoMock,
    fields: luggageInfoFieldsMocks(),
    guestsAmountByType: {
        adults: 2,
        children: 3,
        infants: 3,
    },
});

let props: IHolidaySummaryBagsProps;
let mockStores;

jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummarySeats/components/AmendDatesSummarySeatsBags/AmendDatesSummarySeatsBags.utils',
    () => ({
        getLuggageMetaData: jest.fn(() => [{ luggage: { amount: '1' }, weightLabel: '2', name: '3' }]),
    }),
);

jest.mock('frontend/utils/luggage.utils', () => ({
    getDefaultBagsOneDirection: jest.fn().mockReturnValue(mockDefaultBags),
    generateExtraLuggageFullInfo: jest.fn().mockReturnValue(extraLuggage),
}));

const mockLuggageInfo = jest.fn();
jest.mock('frontend/components/common/Booking/LuggageInfo/LuggageInfo', () => ({
    __esModule: true,
    default: props => {
        mockLuggageInfo(props);

        return <div data-tid='luggage-info' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const extraLuggage = [
    {
        LUG: {
            description: 'Description',
            icon: 'src',
            name: '23kg Extra Hold Bag',
            quantity: 1,
        },
    },
    {
        BIKE: {
            description: 'Description',
            icon: 'src',
            name: 'Bike',
            quantity: 1,
        },
    },
];

describe('<HolidaySummaryBags />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                getPhrase: jest.fn(k => k),
                sportEquipmentCategoryCodes: ['SEO', 'SEC'],
                holdLuggageCategoryCodes: ['BAGE'],
            },
        });
        props = createProps();
    });

    it('should render components', () => {
        render(<HolidaySummaryBags {...props} />);

        expect(utils.generateExtraLuggageFullInfo).toHaveBeenCalledWith(
            props.luggageInfo.items,
            mockStores.layoutStore.sportEquipmentCategoryCodes,
            mockStores.layoutStore.holdLuggageCategoryCodes,
        );
        expect(utils.getDefaultBagsOneDirection).toHaveBeenCalledWith(props.luggageInfo.items);
        expect(mockLuggageInfo).toHaveBeenCalledWith({
            fields: props.fields,
            infantsNumber: 3,
            titleClassName: 'title',
            defaultBagsOneDirection: mockDefaultBags,
            extraLuggageFullInfo: extraLuggage,
            guestWithHoldLuggage: 5,
        });
        expect(screen.getByTestId('luggage-info')).toBeInTheDocument();
        expect(screen.queryByTestId('test-tid-title')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HolidaySummaryBags {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
