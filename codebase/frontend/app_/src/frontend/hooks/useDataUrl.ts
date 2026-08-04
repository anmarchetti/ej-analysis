import { useEffect, useState } from 'react';

import { cmsUrls } from 'code/endpoints';
import { toDataURL } from 'frontend/utils/image.utils';

const useDataUrl = (url?: string): string => {
    const [src, setSrc] = useState('');

    useEffect(() => {
        url?.length &&
            toDataURL(cmsUrls.media(url), dataUrl => {
                setSrc(dataUrl);
            });
    }, [url]);

    return src;
};

export default useDataUrl;
