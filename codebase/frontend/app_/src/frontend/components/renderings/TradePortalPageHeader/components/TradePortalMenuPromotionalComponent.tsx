import React from 'react';

import { cmsUrls } from 'code/endpoints';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

export interface IMenuPromotionalComponentProps {
    onClick: (e: React.MouseEvent, name?: string) => void;
    promotionalComponent: IPromoBlockFields;
}

const TradePortalMenuPromotionalComponent = ({ promotionalComponent, onClick }: IMenuPromotionalComponentProps) => {
    const promoFields = promotionalComponent?.fields;

    const getPromotionImage = () => {
        const src = promoFields?.Image?.value?.src;

        return src ? `url("${cmsUrls.media(src, getMediaSizeParams(MediaSize.Medium))}")` : '';
    };

    if (!promotionalComponent || !promoFields) {
        return null;
    }

    const handleClick = e => {
        onClick(
            e,
            (e.target.classList.contains('header_trade__destination-menu__list-promotional-image') ? 'Image: ' : '') +
                promotionalComponent.fields.Title.value,
        );
    };

    return (
        <RouterLink
            className='header_trade__destination-menu__list-promotion-cta'
            link={promoFields.Link}
            onClick={handleClick}
        >
            <div
                className='header_trade__destination-menu__list-promotional-image'
                style={{ backgroundImage: getPromotionImage() }}
            />
            <div className='header_trade__destination-menu__list-promotional-link'>
                {promoFields.Title?.value}
                <IconChevronRight />
            </div>
            <RichTextWithLinks
                field={promoFields.Description}
                className='header_trade__destination-menu__list-promotional-description'
            />
        </RouterLink>
    );
};

export default TradePortalMenuPromotionalComponent;
