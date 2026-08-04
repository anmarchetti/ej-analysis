import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { ISession } from 'frontend/utils/auth/auth.utils';

const useSSOSession = (): void => {
    const { data: session, status } = useSession();

    const { isLoggingOut, onLogout, updateUserData, redirectTo, redirectUrlLocal } = useStore(
        (stores: ITradePortalStores) => ({
            onLogout: stores.userStore.onLogout,
            updateUserData: stores.userStore.updateUserData,
            redirectTo: stores.routerStore.redirectTo,
            redirectUrlLocal: stores.userStore.redirectUrlLocal,
            isLoggingOut: stores.userStore.isLoggingOut,
        }),
    );

    useEffect(() => {
        const typifiedSession = session as ISession;

        if (isLoggingOut) {
            return;
        }

        if (typifiedSession?.error) {
            onLogout();
        } else if (status === 'authenticated') {
            updateUserData(typifiedSession);
            redirectTo(redirectUrlLocal);
        }
    }, [session, status, updateUserData, onLogout, isLoggingOut]);
};

export default useSSOSession;
