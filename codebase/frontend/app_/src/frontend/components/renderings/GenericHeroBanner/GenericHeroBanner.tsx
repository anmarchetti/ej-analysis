import * as React from 'react';
import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventLocations } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import HeroBannerContent from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerContent/HeroBannerContent';
import HeroBannerImages from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerImages/HeroBannerImages';
import HeroBannerPromo from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerPromo/HeroBannerPromo';
import {
    CREDIT_FREE_VARIANTS,
    getHeroBannerClassNames,
    getHeroBannerControls,
} from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import styles from './GenericHeroBanner.module.scss';

interface IHeroBannerParams {
    ClassName?: string;
}

export interface IHeroBannerProps extends ISitecoreComponent<IHeroBannerFields, IHeroBannerParams> {
    isLower?: boolean;
    singleSlide?: boolean;
}

export const HeroBanner: FunctionComponent<IHeroBannerProps> = props => {
    const { sitePath, experiments, trackHomepageAction, trackPersonalizedClick, saveHeroBannerClickEvent } = useStore(
        (stores: TStores) => ({
            sitePath: stores.layoutStore.sitePath,
            experiments: stores.engageStore.experimentsByUniqueId,
            trackHomepageAction: stores.trackingStore.trackHomepageAction,
            trackPersonalizedClick: stores.trackingStore.trackPersonalizedClick,
            saveHeroBannerClickEvent: stores.engageStore.saveHeroBannerClickEvent,
        }),
    );

    if (!props.fields) {
        return null;
    }

    const { fields, rendering, params, isLower, singleSlide } = props;
    const { Title, Subtitle, Subtitle2, Variant, Brightness, CTA, Image, MobileOnlyImage, TextColor } = fields;
    const experiment = experiments?.[rendering?.uid];
    const variant = Variant?.value;
    const isDefaultVariant = !Object.values(GenericHeroBannerVariant).includes(variant);
    const showCredits = !CREDIT_FREE_VARIANTS.includes(variant);
    const [firstControl] = getHeroBannerControls([CTA], experiment);

    const handleClickComponent = (): void => {
        saveHeroBannerClickEvent(rendering?.uid, EventTypes.HeroBannerClick);
        trackHomepageAction(EventTypes.HeroBannerClick, {
            location: EventLocations.HeroBannerImage,
            name: getTextFromHtml(Title?.value ?? ''),
            section: getTextFromHtml(Subtitle?.value ?? Subtitle2?.value ?? ''),
        });
    };

    const handleClickButton = (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>, position?: string): void => {
        saveHeroBannerClickEvent(rendering?.uid, EventTypes.HeroBannerButtonClick);
        trackPersonalizedClick(
            EventTypes.HeroBannerButtonClick,
            rendering?.uid,
            EventLocations.HeroBannerButton,
            link.value.text,
            buildSitecoreLinkFullUrl(link, sitePath),
            { position, section: getTextFromHtml(Title?.value ?? '') },
        );
        //shouldn't be handled by parent component onClick action
        e.stopPropagation();
    };

    const [bannerClassName, contentClassName, wrapperClassName] = getHeroBannerClassNames(
        variant,
        Brightness?.value,
        TextColor,
        isLower,
        singleSlide,
        params?.ClassName,
    );

    return (
        <div
            className={classNames(bannerClassName, {
                [styles.lightboxWithRoundel]: variant === GenericHeroBannerVariant.LightboxWithRoundel,
                [styles.multiMessageThreeBoxes]: variant === GenericHeroBannerVariant.MultiMessageThreeBoxes,
            })}
            data-tid='generic-hero-banner'
        >
            <button
                className={styles.clickHandler}
                onClick={handleClickComponent}
                data-tid='hero-banner-click-catcher'
                tabIndex={-1}
                aria-hidden='true'
            />
            <div className={classNames(contentClassName, styles.contentBox)}>
                <div className={styles.imageBox}>
                    <HeroBannerImages mobileImage={MobileOnlyImage} image={Image} />
                </div>
                <div className={classNames(wrapperClassName, styles.contentWrapper)}>
                    <HeroBannerContent
                        fields={props.fields}
                        experiment={experiment}
                        handleClickButton={handleClickButton}
                    />
                    {showCredits && <CreditAnchor fields={fields} className={styles.content} />}
                </div>
            </div>
            {isDefaultVariant && (
                <HeroBannerPromo
                    fields={fields}
                    onClickLink={(e: React.MouseEvent): void => handleClickButton(e, firstControl)}
                />
            )}
        </div>
    );
};

export default observer(HeroBanner);
