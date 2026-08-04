import { FC } from 'react';

import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import FeaturedDestinations from 'frontend/components/renderings/PromoBlocks/components/FeaturedDestinations/FeaturedDestinations';
import IconTextBlocksAlt from 'frontend/components/renderings/PromoBlocks/components/IconTextBlocksAlt';
import IconTextCarousel from 'frontend/components/renderings/PromoBlocks/components/IconTextCarousel/IconTextCarousel';
import LinkTileWithBorder from 'frontend/components/renderings/PromoBlocks/components/LinkTileWithBorder/LinkTileWithBorder';
import MosaicBlocks from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/MosaicBlocks';
import TextBlockAlts from 'frontend/components/renderings/PromoBlocks/components/TextAltBlocks';
import VerticalStripeBlocks from 'frontend/components/renderings/PromoBlocks/components/VerticalStripeBlocks';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';

export interface IPromoBlockGroupProps {
    handleClickItem: (item: IPromoBlockFields) => void;
    items: IPromoBlockFields[];
    params: IPromoBlocksParams;
    titleClassName: string;
    Link?: ISitecoreField<ISitecoreLink>;
    displayNumberOfNights?: boolean;
    isMultiRow?: boolean;
}

export const PromoBlocksGroup: FC<IPromoBlockGroupProps> = ({
    items,
    Link,
    handleClickItem,
    displayNumberOfNights,
    params,
    isMultiRow,
    titleClassName,
}) => {
    switch (params.Theme) {
        case PromoBlocksThemes.Mosaic:
            return (
                <MosaicBlocks
                    items={items}
                    onClickItem={handleClickItem}
                    link={Link}
                    displayNumberOfNights={displayNumberOfNights || false}
                    titleClassName={titleClassName}
                />
            );
        case PromoBlocksThemes.IconTextCarousel:
            return <IconTextCarousel items={items} params={params} titleClassName={titleClassName} />;
        case PromoBlocksThemes.FeaturedDestinationsVariant:
            return <FeaturedDestinations items={items} titleClassName={titleClassName} />;
        case PromoBlocksThemes.IconTextAlt:
            return <IconTextBlocksAlt items={items} multiRow={!!isMultiRow} titleClassName={titleClassName} />;
        case PromoBlocksThemes.TextAlt:
            return <TextBlockAlts items={items} titleClassName={titleClassName} />;
        case PromoBlocksThemes.VerticalStripe:
            return (
                <VerticalStripeBlocks
                    items={items}
                    titleClassName={titleClassName}
                    isButtonOutlined={isSitecoreCheckboxSelected(params.IsButtonOutlined)}
                />
            );
        case PromoBlocksThemes.LinkTileWithBorder:
            return <LinkTileWithBorder items={items} titleClassName={titleClassName} />;

        default:
            return null;
    }
};
