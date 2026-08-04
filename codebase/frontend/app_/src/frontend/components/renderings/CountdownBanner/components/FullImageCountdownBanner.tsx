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

interface IFullImageCountdownBannerProps extends ICountdownBannerProps {
    onClickButton: (event: React.MouseEvent<HTMLAnchorElement>, link: ISitecoreField<ISitecoreLink>) => void;
    onClickComponent: (event: React.MouseEvent<HTMLDivElement>) => void;
    time: ICountdownTime[];
    backgroundStyles?: React.CSSProperties;
    isLower?: boolean;
    singleSlide?: boolean;
}

const FullImageCountdownBanner: React.FC<IFullImageCountdownBannerProps> = ({
    fields,
    time,
    backgroundStyles,
    isLower,
    singleSlide,
    onClickButton,
    onClickComponent,
}) => {
    if (!fields) {
        return null;
    }

    const { IntroTitle, Title, CountdownLabel, CTA } = fields;

    const handleCtaClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        if (CTA?.value) {
            onClickButton(event, CTA);
        }
    };

    return (
        <div
            className={classNames(
                'hero-banner countdown-banner countdown-banner__full-image',
                isLower && 'low',
                singleSlide && 'single-slide',
            )}
            style={backgroundStyles}
            onClick={onClickComponent}
        >
            <div className='countdown-banner__wrapper'>
                <div className='countdown-banner__title'>
                    {!!IntroTitle?.value && <Text tag='p' field={IntroTitle} />}
                    <div className='countdown-banner__title__wrapper'>
                        {!!Title?.value && (
                            <h2>
                                <RichTextWithLinks field={Title} />
                            </h2>
                        )}
                    </div>
                </div>

                <div className='countdown-block'>
                    {!!CountdownLabel?.value && (
                        <Text tag='p' className='countdown-block__text d-none d-md-block' field={CountdownLabel} />
                    )}
                    <Countdown time={time} />
                </div>

                {!!CTA?.value?.href && CTA.value.text && (
                    <RouterLink link={CTA} className='countdown-banner__btn btn' onClick={handleCtaClick}>
                        {CTA.value.text}
                    </RouterLink>
                )}

                <CreditAnchor fields={fields} isPillStyle={true} />
            </div>
        </div>
    );
};

export default FullImageCountdownBanner;
