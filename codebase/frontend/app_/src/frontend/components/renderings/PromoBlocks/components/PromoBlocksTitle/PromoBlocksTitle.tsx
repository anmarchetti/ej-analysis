import React from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import FeaturedFacilitiesTitle from 'frontend/components/renderings/HotelDetails/HotelFacilities/components/FeaturedFacilities/FeaturedFacilitiesTitle';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';
import styles from 'frontend/components/renderings/PromoBlocks/PromoBlocks.module.scss';

type TPromoBlocksCarouselProps = {
    rendering: any;
    theme: IPromoBlocksParams['Theme'] | undefined;
};

const PromoBlocksTitle = ({ theme, rendering }: TPromoBlocksCarouselProps) => {
    const { pageName, isEditMode } = useStore((stores: TStores) => ({
        pageName: stores.layoutStore.pageName,
        isEditMode: stores.layoutStore.isEditMode,
    }));

    if (theme === PromoBlocksThemes.FeaturedFacilities) {
        return <FeaturedFacilitiesTitle hotelName={pageName} />;
    }

    if (!rendering?.placeholders?.[PlaceholderNames.TitleBlock]) {
        return null;
    }

    const title = (
        <div className={styles['promo-block-title']} data-tid='promo-block-title'>
            <Placeholder name={PlaceholderNames.TitleBlock} rendering={rendering} />
        </div>
    );

    return isEditMode ? (
        // Wrap Placeholder in <div> to fix broken styles in Experience Editor
        <div>{title}</div>
    ) : (
        title
    );
};

export default observer(PromoBlocksTitle);
