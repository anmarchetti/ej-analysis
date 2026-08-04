import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockHotel } from 'frontend/__mocks__';
import { validatedLuggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import * as luggageUtils from 'frontend/utils/luggage.utils';

import { HoldBagsShortInfo, IHoldBagsShortInfoProps } from './HoldBagsShortInfo';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

const createProps = (): IHoldBagsShortInfoProps => ({
    extraLuggageItems: validatedLuggageInfoMock.items,
    luggageCount: 4,
    luggageText: 'luggageText',
    packageIcons: mockHotel.theme.packageIcons,
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    getLuggageIcon: jest.fn().mockReturnValue({ iconUrl: 'iconUrl' }),
    getHoldItemsLabel: jest.fn().mockReturnValue('getHoldItemsLabel result'),
}));

const mockHolidaySummaryRoomAndBoardProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryRoomAndBoardProps(props);

        return <div data-tid='rooms-and-boards' />;
    },
}));

describe('<HoldBagsShortInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render based on package icons', () => {
        render(<HoldBagsShortInfo {...mockProps} />);

        expect(luggageUtils.getLuggageIcon).toHaveBeenCalledWith(mockProps.packageIcons, mockProps.extraLuggageItems);
        expect(screen.getByTestId('luggage-included')).toHaveTextContent('4 luggageText');

        expect(luggageUtils.getHoldItemsLabel).not.toHaveBeenCalled();
        expect(screen.queryByTestId('hold-bags')).not.toBeInTheDocument();
    });

    it('should render fallback image when no package icons', () => {
        mockProps.packageIcons = undefined;

        render(<HoldBagsShortInfo {...mockProps} />);

        expect(luggageUtils.getHoldItemsLabel).toHaveBeenCalledWith(4, mockStores.layoutStore.getPhrase);
        expect(screen.getByTestId('hold-bags')).toHaveTextContent('getHoldItemsLabel result');

        expect(luggageUtils.getLuggageIcon).not.toHaveBeenCalled();
        expect(screen.queryByTestId('luggage-included')).not.toBeInTheDocument();
    });

    it('should render fallback image when package icons array is empty', () => {
        mockProps.packageIcons = [];

        render(<HoldBagsShortInfo {...mockProps} />);

        expect(luggageUtils.getHoldItemsLabel).toHaveBeenCalledWith(4, mockStores.layoutStore.getPhrase);
        expect(screen.getByTestId('hold-bags')).toHaveTextContent('getHoldItemsLabel result');

        expect(luggageUtils.getLuggageIcon).not.toHaveBeenCalled();
        expect(screen.queryByTestId('luggage-included')).not.toBeInTheDocument();
    });

    it('should not render luggage label when no luggageText and package icons', () => {
        mockProps.luggageText = undefined;

        render(<HoldBagsShortInfo {...mockProps} />);

        expect(screen.getByTestId('luggage-included')).toBeInTheDocument();
        expect(screen.queryByTestId('luggage-label')).not.toBeInTheDocument();
    });
});
