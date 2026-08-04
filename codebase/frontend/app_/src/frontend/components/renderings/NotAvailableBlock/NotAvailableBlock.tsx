import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { buildBasePathByLang } from 'code/basePath';
import { cmsUrls } from 'code/endpoints';
import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface INotAvailableBlockFields {
    Background: ISitecoreField<ISitecoreImage>;
    Description: ISitecoreField<string>;
    DotComLinkDescription: ISitecoreField<string>;
    DotComLinkHelpText: ISitecoreField<string>;
    DotComLinkText: ISitecoreField<string>;
    HolidaysLinkText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    ViewBookingText: ISitecoreField<string>;
}

type TNotAvailableBlockProps = ISitecoreComponent<INotAvailableBlockFields>;

export const NotAvailableBlock = ({ fields }: TNotAvailableBlockProps) => {
    const { lang } = useStore(stores => ({
        lang: stores.layoutStore.lang,
    }));

    if (!fields) {
        return null;
    }

    const locale = lang ? `/${lang.toLowerCase()}` : '';
    const dotComLink = settings.Default.baseDotCom + locale;
    const holidaysLink = buildBasePathByLang('en');

    return (
        <>
            {!!fields.Background?.value?.src && (
                <div
                    data-tid='background'
                    className='triangle-background'
                    style={{ backgroundImage: `url(${cmsUrls.media(fields.Background.value.src)})` }}
                >
                    <div className='triangle--w2o' />
                </div>
            )}
            <div className='landing-section row'>
                <div className='col-md-12'>
                    <div className='rounded-container'>
                        {!!fields.Title?.value && (
                            <Text tag='h2' className='landing-section__title' field={fields.Title} />
                        )}
                        {!!fields.Description?.value && (
                            <Text
                                tag='p'
                                data-tid='description'
                                className='landing-section__content'
                                field={fields.Description}
                            />
                        )}
                        {!!fields.HolidaysLinkText?.value && (
                            <a href={holidaysLink} data-tid='holidays-link' className='btn btn--md'>
                                {fields.HolidaysLinkText.value}
                            </a>
                        )}
                        {!!fields.DotComLinkText?.value && !!fields.DotComLinkHelpText?.value && (
                            <Text tag='h3' className='landing-section__subtitle' field={fields.DotComLinkHelpText} />
                        )}
                        {!!fields.ViewBookingText?.value && (
                            <RichTextWithLinks className='landing-section__help-text' field={fields.ViewBookingText} />
                        )}
                        {!!fields.DotComLinkText?.value && !!fields.DotComLinkDescription?.value && (
                            <Text
                                tag='p'
                                data-tid='dot-com-link-desc'
                                className='landing-section__content'
                                field={fields.DotComLinkDescription}
                            />
                        )}
                        {!!fields.DotComLinkText?.value && (
                            <a href={dotComLink} data-tid='dot-com-link' className='btn btn--md'>
                                {fields.DotComLinkText.value}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotAvailableBlock;
