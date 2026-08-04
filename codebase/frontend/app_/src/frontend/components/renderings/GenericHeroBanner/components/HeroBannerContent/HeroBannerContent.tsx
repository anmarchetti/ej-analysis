import * as React from 'react';
import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import HeroBannerBox from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerBox/HeroBannerBox';
import HeroBannerHeader from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerHeader/HeroBannerHeader';
import HeroBannerLightBox from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerLightBox/HeroBannerLightBox';
import HeroBannerLightboxWithRoundel from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerLightboxWithRoundel/HeroBannerLightboxWithRoundel';
import HeroBannerMultiMessage from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerMultiMessage/HeroBannerMultiMessage';
import HeroBannerStripeBox from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerStripeBox/HeroBannerStripeBox';
import HeroBannerTwinBox from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerTwinBox/HeroBannerTwinBox';
import HeroBannerUnboundedBrand from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerUnboundedBrand/HeroBannerUnboundedBrand';
import styles from 'frontend/components/renderings/GenericHeroBanner/GenericHeroBanner.module.scss';
import { BannerTextColorClass } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

export interface IHeroBannerContentProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    handleClickButton: (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>, position?: string) => void;
}

export const HeroBannerContent: FunctionComponent<IHeroBannerContentProps> = ({
    fields,
    experiment,
    handleClickButton,
}) => {
    const { Title, Variant, TextColor } = fields;

    switch (Variant?.value) {
        case GenericHeroBannerVariant.Standard:
            return <HeroBannerBox fields={fields} experiment={experiment} onClick={handleClickButton} />;

        case GenericHeroBannerVariant.OneBox:
            return (
                <div className='content-box'>
                    <HeroBannerBox
                        fields={fields}
                        experiment={experiment}
                        onClick={handleClickButton}
                        hasAdditionalControl
                    />
                </div>
            );

        case GenericHeroBannerVariant.DualLightboxSlim:
            return (
                <div className='hero-banner--centered-content-dual-lightbox'>
                    <div className='hero-banner__dual-lightbox-container'>
                        <div className='hero-banner__title-container'>
                            {!!Title && (
                                <RichTextWithLinks
                                    field={Title}
                                    tag='h2'
                                    className={classNames('hero-banner__title', BannerTextColorClass[TextColor.value])}
                                />
                            )}
                        </div>
                        <div className='content-box-slim' data-tid='hero-banner-content-box'>
                            <div className='dual-lightbox-slim__container'>
                                <HeroBannerLightBox
                                    fields={fields}
                                    experiment={experiment}
                                    onClick={handleClickButton}
                                />
                                <HeroBannerLightBox
                                    fields={fields}
                                    experiment={experiment}
                                    onClick={handleClickButton}
                                    isSecondBox
                                />
                            </div>
                        </div>
                    </div>
                    <div className={classNames('hero-banner__anchor', styles.content)}>
                        <CreditAnchor fields={fields} isPillStyle />
                    </div>
                </div>
            );

        case GenericHeroBannerVariant.TwoBoxes:
            return (
                <>
                    {!!Title && <RichTextWithLinks field={Title} tag='h2' className='hero-banner__title' />}
                    <div className='content' data-tid='hero-banner-content'>
                        <HeroBannerTwinBox fields={fields} experiment={experiment} onClick={handleClickButton} />
                        <HeroBannerTwinBox
                            fields={fields}
                            experiment={experiment}
                            onClick={handleClickButton}
                            isSecondBox
                        />
                    </div>
                </>
            );

        case GenericHeroBannerVariant.UnboundedBrand:
            return <HeroBannerUnboundedBrand fields={fields} experiment={experiment} onClick={handleClickButton} />;

        case GenericHeroBannerVariant.OpaqueWhiteStripe:
        case GenericHeroBannerVariant.TranslucentWhiteStripe:
            return <HeroBannerStripeBox fields={fields} experiment={experiment} onClick={handleClickButton} />;

        case GenericHeroBannerVariant.LightboxWithRoundel:
            return (
                <HeroBannerLightboxWithRoundel fields={fields} experiment={experiment} onClick={handleClickButton} />
            );

        case GenericHeroBannerVariant.MultiMessageThreeBoxes:
            return <HeroBannerMultiMessage fields={fields} experiment={experiment} onClick={handleClickButton} />;

        default:
            return <HeroBannerHeader fields={fields} />;
    }
};

export default HeroBannerContent;
