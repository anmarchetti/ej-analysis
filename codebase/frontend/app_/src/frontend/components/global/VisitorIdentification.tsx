import React, { useEffect } from 'react';
import { useSitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';

import { envAll } from 'code/env';

/**
 * It's rewritten JSS <VisitorIdentification />.
 * We need to change script src, as jss use '/layouts/system' url.
 * This url doesn't work on prod (EJH-15617), because it tries to load script from .com (not from our sitecore).
 * We should use '/holidays/layouts/system'.
 */

const SCRIPT_URL = envAll.CMS_LAYOUTS_SYSTEM + '/VisitorIdentification.js';

const VIComponent: React.FC = () => {
    const { sitecoreContext } = useSitecoreContext();

    useEffect(() => {
        if (!sitecoreContext.visitorIdentificationTimestamp) {
            return;
        }

        if (document.querySelector('script[data-vi-script]')) {
            return;
        }

        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.type = 'text/javascript';
        script.dataset.viScript = 'true';

        const meta = document.createElement('meta');
        meta.name = 'VIcurrentDateTime';
        meta.content = sitecoreContext.visitorIdentificationTimestamp.toString();

        document.head.appendChild(meta);
        document.head.appendChild(script);

        return () => {
            script.remove();
            meta.remove();
        };
    }, [sitecoreContext.visitorIdentificationTimestamp]);

    return null;
};

VIComponent.displayName = 'VisitorIdentification';
export const VisitorIdentification = VIComponent;
