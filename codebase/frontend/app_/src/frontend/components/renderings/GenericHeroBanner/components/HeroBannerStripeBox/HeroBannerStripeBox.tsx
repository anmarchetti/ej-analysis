import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';
import HeroBannerHeader from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerHeader/HeroBannerHeader';
import styles from 'frontend/components/renderings/GenericHeroBanner/GenericHeroBanner.module.scss';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

export interface IHeroBannerStripeBoxProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (
        e: React.MouseEvent | React.KeyboardEvent,
        link: ISitecoreField<ISitecoreLink>,
        position?: string,
    ) => void;
}

const HeroBannerStripeBox: FunctionComponent<IHeroBannerStripeBoxProps> = ({ fields, experiment, onClick }) => {
    const { PromoLogo, TopText, TextBeforeNumber, NumberValue, TextAfterNumber, CTA } = fields;

    const hasLogoImage = !!PromoLogo?.value?.src;
    const hasLogoLabel = !!TopText?.value;
    const [firstControl] = getHeroBannerControls([CTA], experiment);

    return (
        <div className='hero-banner__stripe-content' data-tid='hero-banner-content'>
            {(hasLogoImage || hasLogoLabel) && (
                <div className='hero-banner__logo'>
                    {hasLogoImage && <JSSImage field={PromoLogo} />}
                    <Text field={TopText} tag='span' />
                </div>
            )}

            <HeroBannerHeader fields={fields} />
            <div className='hero-banner__bottom-content'>
                <div>
                    <Text field={TextBeforeNumber} tag='span' />
                    {TextBeforeNumber?.value && ' '}
                    <Text field={NumberValue} tag='span' className='hero-banner__total' />
                    <Text field={TextAfterNumber} tag='span' />
                </div>
                {!!firstControl?.value?.href && (
                    <RouterLink
                        link={firstControl}
                        className={classNames(styles.content, 'btn hero-banner__btn')}
                        onClick={(e: React.MouseEvent): void => onClick(e, firstControl)}
                    >
                        {firstControl.value.text}
                    </RouterLink>
                )}
            </div>

            <div className='hero-banner__anchor'>
                <CreditAnchor fields={fields} isPillStyle className={styles.content} />
            </div>
        </div>
    );
};

export default HeroBannerStripeBox;
