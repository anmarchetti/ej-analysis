import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import styles from 'frontend/components/renderings/GenericHeroBanner/GenericHeroBanner.module.scss';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

export interface IHeroBannerLightBoxProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>, position?: string) => void;
    isSecondBox?: boolean;
}

const HeroBannerLightBox: FunctionComponent<IHeroBannerLightBoxProps> = ({
    fields,
    experiment,
    isSecondBox,
    onClick,
}) => {
    const { Subtitle, Subtitle2, CTA, CTA2, TextBeforeNumber, TextBeforeNumber2 } = fields;

    const [firstControl, secondControl] = getHeroBannerControls(
        [CTA, CTA2].filter(Boolean) as ISitecoreField<ISitecoreLink>[],
        experiment,
    );

    const mainFields = isSecondBox
        ? {
              description: TextBeforeNumber2,
              button: secondControl,
              subtitle: Subtitle2,
          }
        : {
              description: TextBeforeNumber,
              button: firstControl,
              subtitle: Subtitle,
          };

    return (
        <div className='dual-lightbox-slim__container-left'>
            {!!mainFields.subtitle && (
                <RichTextWithLinks
                    className={classNames(
                        'hero-banner__subtitle',
                        !mainFields.description?.value && 'hero-banner__subtitle-without-description',
                    )}
                    field={mainFields.subtitle}
                    tag='div'
                />
            )}

            <Text className='hero-banner__description' field={mainFields.description} tag='p' />

            {!!mainFields.button?.value?.href && (
                <RouterLink
                    link={mainFields.button}
                    className={classNames(styles.content, 'btn hero-banner__btn')}
                    onClick={(e: React.MouseEvent): void => onClick(e, mainFields.button)}
                >
                    {mainFields.button.value.text}
                </RouterLink>
            )}
        </div>
    );
};

export default HeroBannerLightBox;
