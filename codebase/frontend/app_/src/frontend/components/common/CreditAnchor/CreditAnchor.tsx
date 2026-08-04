import * as React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';

export interface ICreditAnchorFields {
    CreditIcon: ISitecoreField<ISitecoreImage>;
    CreditLink: ISitecoreField<ISitecoreLink>;
    CreditText: ISitecoreField<string>;
    DisableCreditAnchor?: ISitecoreField<boolean>;
}

interface ICreditAnchorProps {
    fields: ICreditAnchorFields;
    className?: string;
    isHomepageBannerElement?: boolean;
    isPillStyle?: boolean;
}

export const CreditAnchor = ({
    fields,
    isPillStyle,
    isHomepageBannerElement = true,
    className,
}: ICreditAnchorProps): React.ReactElement | null => {
    const { isEditMode, trackHomepageAction, sitePath } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
        trackHomepageAction: stores.trackingStore.trackHomepageAction,
        sitePath: stores.layoutStore.sitePath,
    }));

    if (
        !fields ||
        fields.DisableCreditAnchor?.value ||
        (!isEditMode && !fields.CreditLink?.value?.href && !fields.CreditText?.value && !fields.CreditIcon?.value?.src)
    ) {
        return null;
    }

    const { CreditLink, CreditText, CreditIcon } = fields;

    const handleClick = (
        e: React.MouseEvent<Element, MouseEvent>,
        name: string,
        link?: ISitecoreField<ISitecoreLink>,
    ): void => {
        if (isHomepageBannerElement) {
            trackHomepageAction(EventTypes.HeroBannerOfferConditions, {
                location: 'Hero Banner Image',
                name,
                destination: link?.value?.href || link?.value?.url ? buildSitecoreLinkFullUrl(link, sitePath) : '',
            });
            //shouldn't be handled by parent component onClick action
            e.stopPropagation();
        }
    };

    const renderIcon = (): JSX.Element | false => {
        const iconSrc = CreditIcon?.value?.src;

        return (
            !!iconSrc && (
                <span
                    className='credit-anchor__icon icon--bg-image'
                    style={{ backgroundImage: `url(${cmsUrls.media(iconSrc)})` }}
                />
            )
        );
    };

    const renderContent = (text: string | undefined): JSX.Element => (
        <>
            {renderIcon()}
            {!!text && <span>{text}</span>}
        </>
    );

    const creditClassName = classNames('credit-anchor', className, isPillStyle && 'credit-anchor--pill');

    return !!CreditLink?.value?.href ? (
        <RouterLink
            dataId='router-link'
            link={CreditLink}
            className={creditClassName}
            onClick={(e): void => handleClick(e, CreditLink.value.text || CreditText.value, CreditLink)}
        >
            {renderContent(CreditLink.value.text || CreditText.value)}
        </RouterLink>
    ) : (
        <div className={creditClassName} onClick={e => handleClick(e, CreditText?.value)}>
            {renderContent(CreditText?.value)}
        </div>
    );
};

export default observer(CreditAnchor);
