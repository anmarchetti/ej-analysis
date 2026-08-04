import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as utils from 'frontend/utils/webStorage.utils';
import { QueryParamName } from 'models/enum/QueryParamName';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { SitecorePersonalizeLoader } from './SitecorePersonalizeLoader';

const mockSetWebStorageItem = jest.spyOn(utils, 'setWebStorageItem').mockImplementation(jest.fn());
jest.mock('frontend/utils/isBackend', () => jest.fn(() => false));

const createStores = () =>
    createMockStores({
        layoutStore: {
            layout: {},
            isTradePortal: false,
        },
        engageStore: {
            callEngage: jest.fn(),
            sendPersonalizeEventsAfterSuccessfulPayment: jest.fn(),
            sendIdentityEvent: jest.fn(),
            sendMarketingEvent: jest.fn(),
            initializeEngage: jest.fn(),
            isOrderCheckoutSent: false,
            engage: {},
        },
        routerStore: {
            isBookingConfirmationPage: jest.fn(() => true),
            router: {
                query: {},
            },
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('SitecorePersonalizeLoader', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should NOT render', () => {
        const { container } = render(<SitecorePersonalizeLoader />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call callEngage and sendPersonalizeEventsAfterSuccessfulPayment when isOrderCheckoutSent is false and isBookingConfirmationPage', async () => {
        render(<SitecorePersonalizeLoader />);

        await waitFor(() =>
            expect(mockStores.engageStore.sendPersonalizeEventsAfterSuccessfulPayment).toHaveBeenCalled(),
        );
        expect(mockStores.engageStore.callEngage).toHaveBeenCalled();
    });

    it('should NOT call sendPersonalizeEventsAfterSuccessfulPayment when isTradePortal is true', async () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<SitecorePersonalizeLoader />);

        expect(mockStores.engageStore.sendPersonalizeEventsAfterSuccessfulPayment).not.toHaveBeenCalled();
    });

    it('should call callEngage and setWebStorageItem when isOrderCheckoutSent is true and isBookingConfirmationPage is false', async () => {
        mockStores.engageStore.isOrderCheckoutSent = true;
        mockStores.routerStore.isBookingConfirmationPage = jest.fn(() => false);

        render(<SitecorePersonalizeLoader />);

        expect(mockStores.engageStore.callEngage).toHaveBeenCalled();
        expect(mockSetWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.IsOrderCheckoutSent, false, sessionStorage);
    });

    it('should NOT call setWebStorageItem, sendPersonalizeOrderData, sendExperimentEvents and sendOrderCheckoutEvent when isOrderCheckoutSent is true and isBookingConfirmationPage is true', async () => {
        mockStores.engageStore.isOrderCheckoutSent = true;

        render(<SitecorePersonalizeLoader />);

        expect(mockSetWebStorageItem).not.toHaveBeenCalled();
        expect(mockStores.engageStore.sendPersonalizeEventsAfterSuccessfulPayment).not.toHaveBeenCalled();
    });

    describe('sendMarketingEvent', () => {
        it('should call sendIdentityEvent when isHolidays, has utm_medium and campaign_name', () => {
            mockStores.routerStore.router.query = {
                [QueryParamName.UtmMedium]: 'email',
                [QueryParamName.UtmCampaign]: 'UtmCampaign',
            };

            render(<SitecorePersonalizeLoader />);

            expect(mockStores.engageStore.sendMarketingEvent).toHaveBeenCalled();
        });

        it('should NOT call sendIdentityEvent when isTradePortal is true', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.routerStore.router.query = { [QueryParamName.UtmMedium]: 'email' };

            render(<SitecorePersonalizeLoader />);

            expect(mockStores.engageStore.sendMarketingEvent).not.toHaveBeenCalled();
        });

        it('should NOT call sendIdentityEvent when utm_medium is not present', () => {
            mockStores.routerStore.router.query = { [QueryParamName.UtmCampaign]: 'UtmCampaign' };

            render(<SitecorePersonalizeLoader />);

            expect(mockStores.engageStore.sendMarketingEvent).not.toHaveBeenCalled();
        });

        it('should NOT call sendIdentityEvent when campaign_name is not present', () => {
            mockStores.routerStore.router.query = { [QueryParamName.UtmMedium]: 'email' };

            render(<SitecorePersonalizeLoader />);

            expect(mockStores.engageStore.sendMarketingEvent).not.toHaveBeenCalled();
        });
    });
});
