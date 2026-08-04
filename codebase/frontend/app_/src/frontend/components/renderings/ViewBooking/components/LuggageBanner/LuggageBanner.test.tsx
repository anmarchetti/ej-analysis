import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import LuggageBanner from './LuggageBanner';

const createStores = () => ({
    viewBookingStore: {
        isFlightExternal: false,
    },
    layoutStore: {
        isExtraLuggageEnabled: true,
        isConfirmationPage: false,
    },
});
const createProps = () => ({
    LuggageDisabledDescription: mockSitecoreField('LuggageDisabledDescription'),
    LuggageDisabledHeader: mockSitecoreField('LuggageDisabledHeader'),
    LuggageInternalDescription: mockSitecoreField('LuggageInternalDescription'),
    LuggageInternalHeader: mockSitecoreField('LuggageInternalHeader'),
    LuggageDisabledCTA: mockSitecoreField('LuggageDisabledCTA'),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlockComponent = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlockComponent(props);

        return <div data-tid='info-block' />;
    },
}));

describe('<Luggage Banner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render internal flight info banner when isExtraLuggageEnabled is true and isFlightExternal is false', () => {
        render(<LuggageBanner {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockComponent).toHaveBeenCalled();
        expect(mockInfoBlockComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.LuggageInternalHeader,
                text: mockProps.LuggageInternalDescription,
                link: mockProps.LuggageDisabledCTA,
                className: 'luggageBanner',
            }),
        );
    });

    it('should render disabled info banner with isExtraLuggageEnabled is false and isFlightExternal is true', () => {
        mockStores.viewBookingStore.isFlightExternal = true;
        mockStores.layoutStore.isExtraLuggageEnabled = false;

        render(<LuggageBanner {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();
        expect(mockInfoBlockComponent).toHaveBeenCalled();
        expect(mockInfoBlockComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.LuggageDisabledHeader,
                text: mockProps.LuggageDisabledDescription,
                link: mockProps.LuggageDisabledCTA,
                className: 'luggageBanner',
            }),
        );
    });

    it('should NOT render banner when isExtraLuggageEnabled is true and isFlightExternal is true', () => {
        mockStores.viewBookingStore.isFlightExternal = true;
        mockStores.layoutStore.isExtraLuggageEnabled = true;

        render(<LuggageBanner {...mockProps} />);

        expect(screen.queryByTestId('info-block')).not.toBeInTheDocument();
    });

    it('should NOT render Luggage Banner when isConfirmationPage is true', () => {
        mockStores.layoutStore.isConfirmationPage = true;
        render(<LuggageBanner {...mockProps} />);

        expect(screen.queryByTestId('info-block')).not.toBeInTheDocument();
    });
});
