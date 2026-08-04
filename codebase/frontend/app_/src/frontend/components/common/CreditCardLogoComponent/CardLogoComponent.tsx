import React, { FC } from 'react';

import { CardType } from 'models/enum/CardType';
import SvgAmericanExpressLogo from 'frontend/components/icons-new/AmericanExpressLogo';
import SvgMaestroLogo from 'frontend/components/icons-new/MaestroLogo';
import SvgMastercardLogo from 'frontend/components/icons-new/MastercardLogo';
import SvgVisaLogo from 'frontend/components/icons-new/VisaLogo';

interface ICardLogoComponentProps {
    cardType: CardType;
    className?: string;
}

export const CardLogoComponent: FC<ICardLogoComponentProps> = ({ cardType, className }) => {
    switch (cardType) {
        case CardType.Visa:
            return <SvgVisaLogo className={className} />;
        case CardType.Mastercard:
            return <SvgMastercardLogo className={className} />;
        case CardType.AmericanExpress:
            return <SvgAmericanExpressLogo className={className} />;
        case CardType.Maestro:
            return <SvgMaestroLogo className={className} />;
        default:
            return null;
    }
};
