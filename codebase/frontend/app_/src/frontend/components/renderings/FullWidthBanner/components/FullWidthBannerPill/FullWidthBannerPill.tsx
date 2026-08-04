import { FC } from 'react';

import { PillColourVariant } from 'models/data/IFullWithBanner';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

export interface IFullWidthBannerPillProps {
    PillColour?: PillColourVariant;
    PillText?: ISitecoreField<string>;
    className?: string;
}

const FullWidthBannerPill: FC<IFullWidthBannerPillProps> = ({
    PillText,
    PillColour = PillColourVariant.Green,
    className = '',
}) => {
    if (!PillText?.value) {
        return null;
    }

    return (
        <PricePill
            className={className}
            isRed={PillColour === PillColourVariant.Red}
            isYellow={PillColour === PillColourVariant.Yellow}
            isGreen={PillColour === PillColourVariant.Green}
            isBlack={PillColour === PillColourVariant.Black}
        >
            {PillText.value}
        </PricePill>
    );
};

export default FullWidthBannerPill;
