import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';

export interface IHeroBannerImagesProps {
    image: ISitecoreField<ISitecoreImage>;
    mobileImage: ISitecoreField<ISitecoreImage>;
}

const HeroBannerImages: FunctionComponent<IHeroBannerImagesProps> = ({ mobileImage, image }) => {
    const isEditMode = useStore(({ layoutStore }: TStores) => layoutStore.isEditMode);
    const isMobile = useMobileViewport();
    const field = isMobile && !!mobileImage?.value?.src ? mobileImage : image;

    if (isEditMode) {
        return (
            <div className='hero-banner__image exp-editor-bg-image'>
                <JSSImage field={field} />
            </div>
        );
    }

    return <JSSImageNext fill field={field} className='hero-banner__image' priority />;
};

export default observer(HeroBannerImages);
