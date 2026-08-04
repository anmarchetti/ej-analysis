import { FC, useEffect, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { useRouter } from 'next/router';

import { Anchor } from 'code/anchors';
import useStore from 'frontend/hooks/useStore';
import { scrollToOfferConditions } from 'frontend/utils/ui.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import AccordionButton from 'frontend/components/common/AccordionButton';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

interface IFooterLinkParams {
    isItOnlyOnDesktopVisible: TSitecoreCheckboxValue;
}

interface IFooterLinkFields {
    DesktopTitle: ISitecoreField<string>;
    ListOfTitles: IFooterLinkItems[];
    MobileTitle: ISitecoreField<string>;
}

interface IFooterLinkItems {
    id: string;
    fields?: {
        ListOfSubtitles: IFooterSubtitle[];
        Title: ISitecoreField<string>;
    };
}

interface IFooterSubtitle {
    fields: {
        Subtitle: ISitecoreField<string>;
        SubtitleLink: ISitecoreField<ISitecoreLink>;
    };
    id: string;
}

export type TFooterLinkProps = ISitecoreComponent<IFooterLinkFields, IFooterLinkParams> & IComponentWithRerenderProps;

const openMobile = 'openMobile';

const FooterLinks: FC<TFooterLinkProps> = ({ wasRerendered, fields, params }) => {
    const { isScreenMedium } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    const [openPanel, setOpenPanel] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        router.events.on('routeChangeStart', closePanel);

        return () => router.events.off('routeChangeStart', closePanel);
    }, []);

    useEffect(() => {
        closePanel();
    }, [isScreenMedium]);

    const closePanel = () => {
        setOpenPanel(null);
    };

    const toggleOpenPanel = (id: string) => {
        setOpenPanel(prevBlock => {
            const toggleState = prevBlock === id ? null : id;

            if (toggleState) {
                setTimeout(() => {
                    scrollToOfferConditions(Anchor.FooterLinks);
                }, 0);
            }

            return toggleState;
        });
    };

    const isOpen = (id: string) => id === openPanel || (!isScreenMedium && openPanel === openMobile);

    const { DesktopTitle, MobileTitle, ListOfTitles } = fields || {};

    const footerLinks = ListOfTitles ?? [];

    const desktopTitles = useMemo(() => footerLinks.map(({ id, fields }) => ({ id, title: fields?.Title })), []);

    if (!fields) return null;

    return (
        <div className='footer-links footer--grey' data-tid='footer-links'>
            <div className='wrapper-container wrapper-container--px'>
                <div className='footer__row row' id='footer-links'>
                    <div className='col-auto'>
                        <Text
                            tag='p'
                            className='footer-links__title d-none d-md-block'
                            data-tid='footer-holidays-title-desktop'
                            field={DesktopTitle}
                        />
                        {wasRerendered && !isScreenMedium && !params.isItOnlyOnDesktopVisible && (
                            <AccordionButton
                                onClick={() => toggleOpenPanel(openMobile)}
                                buttonContent={MobileTitle?.value}
                                isExpanded={isOpen(openMobile)}
                                dataTid='footer-holidays-title-mobile'
                                className='footer-links__toggle-btn'
                            />
                        )}
                    </div>
                    <div className='col-auto'>
                        {desktopTitles.map(({ id, title }) => (
                            <AccordionButton
                                key={id}
                                panelId={id}
                                onClick={() => toggleOpenPanel(id)}
                                buttonContent={title?.value}
                                isExpanded={isOpen(id)}
                                dataTid='footer-holidays-subtitle-desktop'
                                className='footer-links__toggle-btn d-none d-md-inline-block'
                            />
                        ))}
                    </div>
                </div>

                {footerLinks.map(({ id, fields }) => (
                    <div id={id} key={id} className={classNames(!isOpen(id) && 'd-none')}>
                        <div className='footer-links__wrapper'>
                            <Text
                                tag='p'
                                className='footer-links__subtitle'
                                data-tid='footer-holidays-subtitle'
                                field={fields?.Title}
                            />
                            <div className='row mx-0 mt-2 mt-lg-3'>
                                {fields?.ListOfSubtitles?.map(({ id, fields }: IFooterSubtitle) => (
                                    <RouterLink key={id} link={fields?.SubtitleLink} dataId='footer-holidays-link'>
                                        {fields?.Subtitle.value}
                                    </RouterLink>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default withRerender(observer(FooterLinks));
