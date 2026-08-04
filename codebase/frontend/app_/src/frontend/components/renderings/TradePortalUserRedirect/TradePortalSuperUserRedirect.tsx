import React from 'react';
import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

interface ITradePortalSuperUserRedirectFields {
    TradePortalSuperUserRedirectUrl: LinkField;
}

export interface ITradePortalSuperUserRedirectProps {
    fields: ITradePortalSuperUserRedirectFields;
}

export const TradePortalSuperUserRedirect: React.FC<ITradePortalSuperUserRedirectProps> = ({ fields }) => {
    const { userRole, redirectTo } = useStore((stores: ITradePortalStores) => ({
        userRole: stores.userStore.agentInfo?.role,
        redirectTo: stores.routerStore.redirectTo,
    }));

    if (!fields) {
        return null;
    }

    const redirectUrl = fields.TradePortalSuperUserRedirectUrl.value.href ?? '';

    if (userRole === TradeUserRoles.SuperUser) {
        redirectTo(redirectUrl);
    }

    return null;
};

export default observer(TradePortalSuperUserRedirect);
