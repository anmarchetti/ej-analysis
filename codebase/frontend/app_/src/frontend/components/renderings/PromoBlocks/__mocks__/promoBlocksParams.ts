import { TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import { BigVariantPillAlignment, BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import { PromoBlockTitleColorOption, TitleFontSizeMobileAndDesktopPromoBlocks } from 'models/enum/PromoBlocksParams';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';

export const promoBlockParamsMocks: IPromoBlocksParams = {
    HasImageDarkOverlay: '1',
    IsLivePriceEnabled: '1',
    ShowShard: '1',
    Theme: PromoBlocksThemes.Big,
    TitleFontSize: TitleFontSizeMobileAndDesktopPromoBlocks.Mobile24Desktop32,
    TitleFontStyle: TitleFontStyle.Rounded,
    TitlePlacement: BigVariantTitlePlacementOptions.TitleBelowImage,
    TitleColor: PromoBlockTitleColorOption.White,
    PillAlignment: BigVariantPillAlignment.Right,
};
