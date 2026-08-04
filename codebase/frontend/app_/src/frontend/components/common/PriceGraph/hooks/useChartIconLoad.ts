import { useEffect, useState } from 'react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import SiteSettings from 'models/enum/SiteSettings';
import PriceGraphSettings from 'frontend/components/common/PriceGraph/constants';

export default function useChartIconLoad(iconInSettings: SiteSettings) {
    const { getSetting } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
    }));
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        let isMounted = true;

        const url = cmsUrls.media(getSetting(iconInSettings));
        const image = new Image(PriceGraphSettings.iconSize, PriceGraphSettings.iconSize);
        image.src = url;

        image.onload = () => {
            isMounted && setImage(image);
        };

        return () => {
            isMounted = false;
        };
    }, []);

    return image;
}
