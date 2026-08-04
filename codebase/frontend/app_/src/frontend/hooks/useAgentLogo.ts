import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { UserService } from 'frontend/services/user.service';
import { TStores } from 'frontend/store/IStores';
import { ISession } from 'frontend/utils/auth/auth.utils';

import useStore from './useStore';

const useAgentLogo = (): string | undefined => {
    const { isTradePortal } = useStore((stores: TStores) => ({
        isTradePortal: stores.layoutStore.isTradePortal,
    }));
    const { data: session } = useSession();

    const [UMLogoImage, setUMLogoImage] = useState<string>();

    useEffect(() => {
        const getAgentInfo = async () => {
            if (session) {
                const { accessToken } = session as ISession;

                if (accessToken) {
                    const result = await UserService.getUMUserInfo(accessToken);
                    const UMLogo = result.agencyLogo || result.consortiumLogo;

                    setUMLogoImage(UMLogo);
                }
            }
        };

        if (isTradePortal) {
            getAgentInfo();
        }
    }, [session]);

    return UMLogoImage;
};

export default useAgentLogo;
