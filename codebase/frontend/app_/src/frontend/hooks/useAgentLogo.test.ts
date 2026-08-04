import { renderHook, waitFor } from '@testing-library/react';

import { mockNextAuthUseSession } from 'frontend/__mocks__/next-auth';
import { UserService } from 'frontend/services/user.service';

import useAgentLogo from './useAgentLogo';

const createStores = () => ({
    layoutStore: {
        isTradePortal: true,
    },
});

const mockUseSessionResponse = {
    data: { accessToken: 'accessToken' },
};

mockNextAuthUseSession.mockReturnValue(mockUseSessionResponse);

const mockUserInfo = {
    agencyLogo: 'agent-logo',
    consortiumLogo: 'consortium-logo',
};

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores }),
}));

describe('useAgentLogo', () => {
    beforeEach(() => {
        mockStores = createStores();
        UserService.getUMUserInfo = jest.fn().mockResolvedValue(mockUserInfo);
    });

    it('should return the agent logo', async () => {
        const { result } = renderHook(() => useAgentLogo());

        await waitFor(() => expect(result.current).toBe(mockUserInfo.agencyLogo));

        expect(result.current).toBe(mockUserInfo.agencyLogo);
    });

    it('should return consortium logo when agent logo is not available', async () => {
        UserService.getUMUserInfo = jest.fn().mockResolvedValue({ ...mockUserInfo, agencyLogo: null });

        const { result } = renderHook(() => useAgentLogo());

        await waitFor(() => expect(result.current).toBe(mockUserInfo.consortiumLogo));
    });

    it('should return undefined if not TradePortal', async () => {
        mockStores.layoutStore.isTradePortal = false;

        const { result } = renderHook(() => useAgentLogo());

        expect(result.current).toBeUndefined();
    });

    it('should return undefined if no session', async () => {
        mockNextAuthUseSession.mockReturnValue({ data: null });

        const { result } = renderHook(() => useAgentLogo());

        expect(result.current).toBeUndefined();
    });
});
