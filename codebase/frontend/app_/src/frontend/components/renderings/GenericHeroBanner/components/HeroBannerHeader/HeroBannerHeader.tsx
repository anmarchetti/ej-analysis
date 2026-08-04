import { FunctionComponent } from 'react';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

export interface IHeroBannerHeaderProps {
    fields: IHeroBannerFields;
}

const HeroBannerHeader: FunctionComponent<IHeroBannerHeaderProps> = ({ fields }) => {
    const { Title, Subtitle, Icon, PromoLogo } = fields;

    return (
        <>
            {!!Title?.value && (
                <h2 className='hero-banner__title' data-tid='hero-banner-title'>
                    {!!Icon?.value?.src && (
                        <div className='hero-banner__icon'>
                            <JSSImage field={Icon} />
                        </div>
                    )}
                    <RichTextWithLinks field={Title} tag='span' />
                    <JSSImage field={PromoLogo} className='hero-banner__logo-for-title d-none' />
                </h2>
            )}
            {!!Subtitle && <RichTextWithLinks className='hero-banner__subtitle' field={Subtitle} tag='div' />}
        </>
    );
};

export default HeroBannerHeader;
