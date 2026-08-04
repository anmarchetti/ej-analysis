import React from 'react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

export type TRoleRenderProps = {
    allowedRoles: TradeUserRoles[];
    children: React.ReactNode;
};

export const RoleRender = ({ allowedRoles, children }: TRoleRenderProps): React.ReactElement | null => {
    const { userRole } = useStore((stores: ITradePortalStores) => ({
        userRole: stores.userStore.agentInfo?.role,
    }));

    if (!allowedRoles.length || (userRole && allowedRoles.includes(userRole))) {
        return <React.Fragment>{children}</React.Fragment>;
    }

    return null;
};
