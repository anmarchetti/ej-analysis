import React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

import { ITradePortalSuperUserRedirectProps, TradePortalSuperUserRedirect } from './TradePortalSuperUserRedirect';

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    userStore: {
        agentInfo: {
            name: 'Agent',
            number: '123456',
            ref: '',
            role: TradeUserRoles.SuperUser,
        },
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
});

const mockTradeSuperUserRedirectUrl = 'TradeSuperUserRedirectUrl';
const resetMocks = (): ITradePortalSuperUserRedirectProps => ({
    fields: {
        TradePortalSuperUserRedirectUrl: mockSitecoreField(mockSitecoreLinkField(mockTradeSuperUserRedirectUrl)),
    },
});

describe('<TradePortalSuperUserRedirect />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should call redirect standard', () => {
        const { container } = render(<TradePortalSuperUserRedirect {...mocks} />);

        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(mockTradeSuperUserRedirectUrl);
        expect(container).toBeEmptyDOMElement();
    });

    it('should call redirect with empty string if TradeSuperUserRedirectUrl href value is not defined', () => {
        mocks.fields.TradePortalSuperUserRedirectUrl = mockSitecoreField(mockSitecoreLinkField());
        const { container } = render(<TradePortalSuperUserRedirect {...mocks} />);

        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith('');
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no fields', () => {
        mocks.fields = undefined;

        const { container } = render(<TradePortalSuperUserRedirect {...mocks} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
    });

    it('should NOT render when user role is not equal to super-user', () => {
        mockStores.userStore.agentInfo.role = TradeUserRoles.Agent;

        const { container } = render(<TradePortalSuperUserRedirect {...mocks} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
    });

    it('should NOT render when user role is not defined', () => {
        mockStores.userStore.agentInfo.role = undefined;

        const { container } = render(<TradePortalSuperUserRedirect {...mocks} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
    });
});
