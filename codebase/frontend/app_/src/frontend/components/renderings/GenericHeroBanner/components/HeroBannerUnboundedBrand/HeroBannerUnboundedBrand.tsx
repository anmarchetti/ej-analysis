import { FC } from 'react';
import classNames from 'classnames';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import HeroBannerControls from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerControls/HeroBannerControls';

import styles from './HeroBannerUnboundedBrand.module.scss';

export interface IHeroBannerUnboundedBrandProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>, position?: string) => void;
}

export const HeroBannerUnboundedBrand: FC<IHeroBannerUnboundedBrandProps> = ({ fields, experiment, onClick }) => {
    const { Title, Subtitle, CTAType, CTA } = fields;

    return (
        <>
            <div data-tid='hero-banner-unbounded-brand-tile' className={styles.wrapper}>
                <RichTextWithLinks
                    dataId='unbounded-brand-hero-banner-subtitle'
                    className={classNames('hero-banner__subtitle', styles.subtitle)}
                    field={Subtitle}
                    tag='div'
                />
                <RichTextWithLinks
                    dataId='unbounded-brand-hero-banner-title'
                    field={Title}
                    tag='h2'
                    className={classNames('hero-banner__title', styles.title)}
                />
            </div>

            <HeroBannerControls
                experiment={experiment}
                controlsFields={[CTA]}
                type={CTAType?.value}
                onClick={onClick}
            />
        </>
    );
};

export default HeroBannerUnboundedBrand;
