import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockDefaultBags } from 'frontend/__mocks__/extraLuggage';
import { getLuggageInfoItems } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo.utils';

import luggageInfoFieldsMocks from './__mocks__/LuggageInfoFields';
import LuggageInfo, { ILuggageInfoProps } from './LuggageInfo';

const createProps = (): ILuggageInfoProps => ({
    fields: luggageInfoFieldsMocks(),
    infantsNumber: 0,
    defaultBagsOneDirection: mockDefaultBags,
    extraLuggageFullInfo: [{}, {}],
    guestWithHoldLuggage: 5,
});

let mockProps = createProps();

jest.mock('frontend/components/common/Booking/LuggageInfo/LuggageInfo.utils', () => ({
    __esModule: true,
    getLuggageInfoItems: jest.fn().mockReturnValue([
        { text: 1, dataTid: 1 },
        { text: 2, dataTid: 2 },
        { text: 3, dataTid: 3 },
        { text: 4, dataTid: 4 },
    ]),
}));

jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlightDefaultBagsLabel: jest.fn().mockReturnValue('LuxuryInternalFlightDefaultBagsLabel'),
}));

describe('LuggageInfo', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render LuggageInfoPayment', () => {
        render(<LuggageInfo {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-info')).toBeInTheDocument();
        expect(screen.getByTestId('hold-luggage-info-title')).toHaveTextContent('LuggageInfoTitle');
        expect(screen.getByTestId('hold-luggage')).toBeInTheDocument();

        expect(getLuggageInfoItems).toHaveBeenCalledWith({
            infantsNumber: 0,
            extraLuggageFullInfo: mockProps.extraLuggageFullInfo,
            defaultBagsOneDirection: mockDefaultBags,
            sportEquipmentsLabel: 'SportEquipmentsLabel',
            pramLabel: 'PramName',
            luxuryInternalFlightBagsLabel: 'LuxuryInternalFlightDefaultBagsLabel',
        });
        expect(screen.getByTestId('1')).toHaveTextContent('1');
        expect(screen.getByTestId('2')).toHaveTextContent('2');
        expect(screen.getByTestId('3')).toHaveTextContent('3');
        expect(screen.getByTestId('4')).toHaveTextContent('4');
    });

    it('should not render title when hideTitle is true', () => {
        mockProps.hideTitle = true;

        render(<LuggageInfo {...mockProps} />);

        expect(screen.queryByTestId('hold-luggage-info-title')).not.toBeInTheDocument();
    });
});
