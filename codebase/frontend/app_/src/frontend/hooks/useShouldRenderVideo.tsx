import { useEffect, useState } from 'react';

import { getCookie, listenCookieChange } from 'frontend/utils/cookies.utils';
import { CookiesKeys } from 'models/enum/CookiesKeys';

const useShouldRenderVideo = (): boolean => {
    const [shouldRenderVideo, setShouldRenderVideo] = useState<boolean>(false);

    useEffect(() => {
        // we listen to Marketing cookie changes to show youtube videos or not. To fix https://jira.build.easyjet.com/browse/EJH-14173
        // according to GDPR we can't show youtube videos without user's agreement
        setShouldRenderVideo(!!Number(getCookie(CookiesKeys.EjMarketingCookie)));

        const clearIntervalCallback = listenCookieChange(
            CookiesKeys.EjMarketingCookie,
            ({ newValue }) => {
                setShouldRenderVideo(!!Number(newValue));
            },
            1000,
        );

        return clearIntervalCallback;
    }, []);

    return shouldRenderVideo;
};

export default useShouldRenderVideo;
