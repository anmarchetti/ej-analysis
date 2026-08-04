import { FunctionComponent } from 'react';
import classNames from 'classnames';

import BannerCTAType from 'models/enum/banners/CTAType';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import RouterLink from 'frontend/components/common/RouterLink';
import styles from 'frontend/components/renderings/GenericHeroBanner/GenericHeroBanner.module.scss';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

export interface IHeroBannerControlsProps {
    controlsFields: Nullable<ISitecoreField<ISitecoreLink>>[];
    experiment: ISitecorePersonalizeExperimentBase;
    onClick: (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>, position?: string) => void;
    type: BannerCTAType;
    isSecondBox?: boolean;
}

const HeroBannerControls: FunctionComponent<IHeroBannerControlsProps> = ({
    isSecondBox,
    controlsFields,
    type,
    onClick,
    experiment,
}) => {
    const controls = getHeroBannerControls(
        controlsFields.filter(Boolean) as ISitecoreField<ISitecoreLink>[],
        experiment,
    );

    const additionalButton = controls[1]?.value;
    const hasAdditionalButton = !!additionalButton?.href && !!additionalButton?.text;

    return (
        <div className={classNames(hasAdditionalButton && 'dual-button-container')}>
            {controls.map(
                (button, index) =>
                    !!button?.value.href &&
                    !!button.value.text && (
                        <RouterLink
                            key={`${button.value.href}_${index}`}
                            link={button}
                            className={classNames(styles.content, 'btn hero-banner__btn inline', {
                                orange: type === BannerCTAType.Orange,
                                white: type === BannerCTAType.White,
                            })}
                            onClick={(e: React.MouseEvent): void => onClick(e, button, isSecondBox ? '2' : undefined)}
                            dataId={`hero-banner-cta-${index + 1}`}
                        >
                            {button.value.text}
                        </RouterLink>
                    ),
            )}
        </div>
    );
};

export default HeroBannerControls;
