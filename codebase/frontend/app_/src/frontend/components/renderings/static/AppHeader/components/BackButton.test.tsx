import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';

import BackButton from './BackButton';

const mockIconProps = jest.fn();
jest.mock('frontend/components/icons-new/ChevronLeft', () => ({
    __esModule: true,
    default: (props: any) => {
        mockIconProps(props);

        return <svg data-tid='chevron-left-icon' />;
    },
}));

jest.mock('frontend/utils/url.utils', () => ({
    ...jest.requireActual('frontend/utils/url.utils'),
    getSiteUrl: (path: string) => path,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStores = createMockStores({
    routerStore: {
        router: {
            back: jest.fn(),
        },
        listenToPopState: jest.fn((cb: (state: any) => boolean) => {
            popStateListeners.push(cb);

            return () => {
                const index = popStateListeners.indexOf(cb);

                if (index > -1) popStateListeners.splice(index, 1);
            };
        }),
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
});

const popStateListeners: Array<(state: any) => boolean> = [];

describe('BackButton', () => {
    describe('Rendering', () => {
        it('should render button element with icon', () => {
            render(<BackButton />);

            expect(screen.getByTestId('back-button')).toBeInTheDocument();
            expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
        });

        it('should display correct text from phrase dictionary', () => {
            render(<BackButton />);

            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsBack)).toBeInTheDocument();
        });
    });

    it('should call router.back and trackingStore.trackEventWithParams when button is clicked', async () => {
        const user = userEvent.setup();
        render(<BackButton />);

        await user.click(screen.getByTestId('back-button'));

        expect(mockStores.routerStore.router.back).toHaveBeenCalledTimes(1);
        expect(mockStores.routerStore.listenToPopState).toHaveBeenCalledTimes(1);

        const state = { as: '/mock-previous-page' };
        popStateListeners.forEach(cb => cb(state));

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Header,
                eventAction: EventActions.Navigation,
                eventLabel: EventLabels.Back,
                eventType: EventTypes.Interaction,
            },
            {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: '/mock-previous-page',
            },
        );
    });
});
