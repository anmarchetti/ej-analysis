import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ICountdownTime } from 'models/data/ICountdownBaner';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { ICountdownBannerProps } from 'frontend/components/renderings/CountdownBanner/CountdownBanner';

import Countdown from './Countdown';

interface IColoredStripeCountdownBannerProps extends ICountdownBannerProps {
    backgroundStyles: React.CSSProperties | undefined;
    isTransparent: boolean;
    onClickButton: (e, link: ISitecoreField<ISitecoreLink>) => void;
    onClickComponent: () => void;
    time: ICountdownTime[];
    isLower?: boolean;
    singleSlide?: boolean;
}

class ColoredStripeCountdownBanner extends React.Component<IColoredStripeCountdownBannerProps> {
    render() {
        const { fields, time, backgroundStyles, isLower, singleSlide, isTransparent, onClickButton, onClickComponent } =
            this.props;

        if (!fields) {
            return null;
        }

        const { IntroTitle, Title, CTA, Subtitle, CountdownLabel } = fields;

        return (
            <div
                className={classNames(
                    'hero-banner',
                    'countdown-banner',
                    isTransparent ? 'countdown-banner__transparent' : 'countdown-banner__orange',
                    isLower && 'low',
                    singleSlide && 'single-slide',
                )}
                onClick={onClickComponent}
            >
                <div className='countdown-banner__content-wrapper'>
                    <div className='countdown-banner__image' style={backgroundStyles} />
                    <div className='countdown-block d-sm-block d-xs-block d-md-none'>
                        <Countdown time={time} className='text-color--orange' />
                    </div>

                    <div className='countdown-banner__wrapper'>
                        <div className='countdown-banner__stripe-content'>
                            <div className='countdown-banner__title'>
                                {!!IntroTitle?.value && <Text tag='p' field={IntroTitle} />}
                                <div className='countdown-banner__title__wrapper'>
                                    {!!Title?.value && (
                                        <h2>
                                            <RichTextWithLinks field={Title} />
                                        </h2>
                                    )}
                                    {!!CTA?.value?.href && (
                                        <RouterLink
                                            link={CTA}
                                            className='countdown-banner__btn btn d-sm-block d-xs-block d-md-none'
                                            onClick={e => onClickButton(e, CTA)}
                                        >
                                            {CTA.value.text}
                                        </RouterLink>
                                    )}
                                </div>
                                {!!Subtitle?.value && <Text tag='p' field={Subtitle} />}
                            </div>
                            <CreditAnchor fields={fields} isPillStyle={true} />
                        </div>

                        <div className='countdown-block d-none d-md-block'>
                            {!!CountdownLabel?.value && (
                                <Text tag='p' className='countdown-block__text' field={CountdownLabel} />
                            )}
                            <Countdown time={time} className='text-color--orange' />
                        </div>

                        {!!CTA?.value?.href && (
                            <RouterLink
                                link={CTA}
                                className='countdown-banner__btn btn d-none d-md-block'
                                onClick={e => onClickButton(e, CTA)}
                            >
                                {CTA.value.text}
                            </RouterLink>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default ColoredStripeCountdownBanner;
