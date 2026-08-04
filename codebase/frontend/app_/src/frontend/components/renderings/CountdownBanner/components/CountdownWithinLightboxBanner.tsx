import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { getHeroBannerWrapperClassNames } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import Countdown from './Countdown';
import { ISearchpodCountdownBannerProps } from './SearchpodCountdownBanner';
import UseCodeTag from './UseCodeTag';

export const CountdownWithinLightboxBanner = (props: ISearchpodCountdownBannerProps) => {
    const { time, fields, isLower, backgroundStyles, singleSlide, onClickButton, onClickComponent } = props;

    if (!fields) {
        return null;
    }

    const {
        Title,
        Subtitle,
        Brightness,
        CountdownLabel,
        TextColor,
        CTA,
        CTAType,
        UseCode,
        AdditionalInfo,
        UseCodeLabel,
    } = fields;
    const isBrightnessDark = Brightness?.value === BannerBrightnessType.Dark;
    const isBrightnessMedium = Brightness?.value === BannerBrightnessType.Medium;

    return (
        <div
            className={classNames(
                'hero-banner countdown-banner countdown-banner--centered-content',
                isBrightnessDark && 'brightness-dark',
                isBrightnessMedium && 'brightness-medium',
                isLower && 'low',
            )}
            onClick={onClickComponent}
        >
            <div className='countdown-banner__image' style={backgroundStyles} />
            <div
                className={getHeroBannerWrapperClassNames(
                    'wrapper-container wrapper-container--px wrapper-container-small',
                    TextColor,
                    singleSlide,
                )}
            >
                <div className='lightbox-container'>
                    {!!Title?.value && <RichTextWithLinks field={Title} tag='h2' className='countdown-banner__title' />}
                    {!!Subtitle?.value && (
                        <div className='countdown-banner__subtitle'>
                            <RichTextWithLinks className='countdown-banner__subtitle-part' field={Subtitle} tag='div' />
                            <UseCodeTag
                                useCode={UseCode}
                                useCodeLabel={UseCodeLabel}
                                classNames='countdown-banner__subtitle-part'
                            />
                        </div>
                    )}
                    <div className='countdown-block'>
                        {!!CountdownLabel?.value && (
                            <Text tag='p' className='countdown-block__text' field={CountdownLabel} />
                        )}
                        <Countdown time={time} className='text-color--grey' />
                    </div>
                    {!!AdditionalInfo?.value && (
                        <RichTextWithLinks
                            className='countdown-banner__additional-info'
                            field={AdditionalInfo}
                            tag='div'
                        />
                    )}
                    {!!CTA?.value?.href && (
                        <RouterLink
                            link={CTA}
                            className={classNames('btn countdown-banner__btn', {
                                orange: CTAType?.value === BannerCTAType.Orange,
                                white: CTAType?.value === BannerCTAType.White,
                            })}
                            onClick={e => onClickButton(e, CTA)}
                        >
                            {CTA?.value?.text}
                        </RouterLink>
                    )}
                </div>
                <CreditAnchor fields={fields} isPillStyle={true} />
            </div>
        </div>
    );
};

export default CountdownWithinLightboxBanner;
