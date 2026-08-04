import React from 'react';
import { render, screen } from '@testing-library/react';

import { IAgentInfo } from 'models/data/tradePortal/IAgentInfo';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

import { RoleRender, TRoleRenderProps } from './RoleRender';

const createStores = () => ({
    userStore: {
        agentInfo: {
            name: '',
            number: '',
            ref: '',
            role: 'agent',
        } as IAgentInfo,
    },
});

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const childrenDataId = 'children';

const resetMocks = (): TRoleRenderProps => ({
    allowedRoles: [TradeUserRoles.Agent],
    children: <div data-tid={childrenDataId} />,
});

describe('RoleRender', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render children when no roles are provided', () => {
        mocks.allowedRoles = [];
        render(<RoleRender {...mocks} />);

        expect(screen.getByTestId(childrenDataId)).toBeInTheDocument();
    });

    it('should NOT render children when agentInfo role is not defined', () => {
        mockStores.userStore.agentInfo.role = undefined;
        render(<RoleRender {...mocks} />);

        expect(screen.queryByTestId(childrenDataId)).not.toBeInTheDocument();
    });

    it('should render children when user role is among allowed roles', () => {
        render(<RoleRender {...mocks} />);

        expect(screen.getByTestId(childrenDataId)).toBeInTheDocument();
    });

    it('should NOT render children when user role is not among allowed roles', () => {
        mocks.allowedRoles = [TradeUserRoles.Admin, TradeUserRoles.Manager];
        render(<RoleRender {...mocks} />);

        expect(screen.queryByTestId(childrenDataId)).not.toBeInTheDocument();
    });

    it('should NOT render children when user role is not defined and allowedRoles is empty', () => {
        mockStores.userStore.agentInfo.role = undefined;
        mocks.allowedRoles = [];
        render(<RoleRender {...mocks} />);

        expect(screen.getByTestId(childrenDataId)).toBeInTheDocument();
    });
});
