import * as React from 'react';
import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';
import styles from 'frontend/components/renderings/GenericHeroBanner/GenericHeroBanner.module.scss';

interface IHeroBannerPromoProps {
    fields: IHeroBannerFields;
    onClickLink: (e: React.MouseEvent) => void;
}

const HeroBannerPromo: FunctionComponent<IHeroBannerPromoProps> = ({ fields, onClickLink }: IHeroBannerPromoProps) => {
    const { TopText, BottomText, BottomLinedText, TextBeforeNumber, NumberValue, TextAfterNumber, CTA, PromoLogo } =
        fields;
    const hasNumberValue = NumberValue?.value;
    const hasTextAfterNumber = TextAfterNumber?.value;
    const hasCTA = CTA?.value?.href && CTA.value.text;
    const hasTopText = TopText?.value;
    const hasBottomText = BottomText?.value;
    const hasBottomLinedText = BottomLinedText?.value;
    const hasPromoLogo = PromoLogo?.value?.src;

    if (
        !(
            hasNumberValue ||
            hasTextAfterNumber ||
            hasCTA ||
            hasTopText ||
            hasBottomText ||
            hasBottomLinedText ||
            hasPromoLogo
        )
    ) {
        return null;
    }

    return (
        <div className='hero-banner__promo-wrapper'>
            <div className='wrapper-container wrapper-container--px'>
                <div className='hero-banner__promo'>
                    <div className='hero-banner__promo-text'>
                        {hasPromoLogo && <JSSImage field={PromoLogo} />}
                        <Text field={TopText} tag='div' />
                        {(hasNumberValue || hasTextAfterNumber) && (
                            <div className='hero-banner__total'>
                                <Text field={TextBeforeNumber} tag='span' className='hero-banner__price-currency' />
                                <Text field={NumberValue} tag='span' />
                                <Text field={TextAfterNumber} tag='small' />
                            </div>
                        )}
                        <Text field={BottomText} tag='span' />
                        <Text field={BottomLinedText} tag='div' className='hero-banner__promo-footer' />
                    </div>
                    {hasCTA && (
                        <RouterLink
                            link={CTA}
                            className={classNames(styles.content, 'btn')}
                            onClick={(e: React.MouseEvent): void => onClickLink(e)}
                        >
                            {CTA.value.text}
                        </RouterLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroBannerPromo;
