import React from 'react';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

interface IMenuPromotionalComponentProps {
    onClick: (e: React.MouseEvent, name?: string) => void;
    promotionalComponent: IPromoBlockFields;
}

const MenuPromotionalComponent = ({ promotionalComponent, onClick }: IMenuPromotionalComponentProps) => {
    const promoFields = promotionalComponent?.fields;

    if (!promotionalComponent || !promoFields) {
        return null;
    }

    const handleClick = e => {
        onClick(
            e,
            (e.target.classList.contains('destination-menu__list-promotional-image') ? 'Image: ' : '') +
                promotionalComponent.fields.Title.value,
        );
    };

    return (
        <RouterLink className='destination-menu__list-promotion-cta' link={promoFields.Link} onClick={handleClick}>
            <div className='destination-menu__list-promotional-image'>
                <JSSImageNext field={promoFields?.Image} fill mediaSize={{ desktop: MediaSize.Medium }} />
            </div>
            <div className='destination-menu__list-promotional-link'>
                {promoFields.Title?.value} <IconChevronRight />
            </div>
            <RichTextWithLinks
                field={promoFields.Description}
                className='destination-menu__list-promotional-description'
            />
        </RouterLink>
    );
};

export default MenuPromotionalComponent;
