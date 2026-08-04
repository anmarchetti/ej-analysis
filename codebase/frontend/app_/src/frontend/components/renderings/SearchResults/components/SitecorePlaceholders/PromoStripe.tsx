import React, { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISinglePromotionInfo } from 'models/data/IPromocode';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

interface IPromoStripeProps {
    index: number;
    promo: ISinglePromotionInfo;
    rendering: any;
}

const PromoStripe: FunctionComponent<IPromoStripeProps> = ({ promo, index = 0, rendering }) => (
    <Placeholder name={PlaceholderNames.PromoStripe} key={`psb-${index}`} rendering={rendering} promo={promo} />
);

export default PromoStripe;
