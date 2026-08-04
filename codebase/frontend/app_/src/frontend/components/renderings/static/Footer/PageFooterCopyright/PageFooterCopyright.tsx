import React, { FunctionComponent, useEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import { useRouter } from 'next/router';

import { Anchor } from 'code/anchors';
import { TStores } from 'frontend/store/IStores';
import { getIdFromAnchor } from 'frontend/utils/navigation.utils';
import { IHomepageEventParams } from 'models/data/tracking/IEventWithParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AccordionButton from 'frontend/components/common/AccordionButton';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './PageFooterCopyright.module.scss';

export interface IContentBlockFields {
    Description: ISitecoreField<string>;
    LinkText: ISitecoreField<string>;
}

export interface IFooterCopyrightProps extends ISitecoreComponent<IContentBlockFields> {
    showOfferConditions: boolean;
    toggleOfferConditions: (state: boolean) => void;
    trackHomepageAction: (event: EventTypes, params: IHomepageEventParams) => void;
}

export const TERMS_PANEL_ID = 'termsPanelId';
export const TRACK_HOMEPAGE_ACTION_PARAMS = {
    location: 'Footer',
    name: 'Offer conditions',
};

export const PageFooterCopyright: FunctionComponent<IFooterCopyrightProps> = props => {
    const router = useRouter();

    const { rendering, fields, trackHomepageAction, toggleOfferConditions, showOfferConditions } = props;

    useEffect(() => {
        const closeAccordion = (): void => {
            if (showOfferConditions) {
                toggleOfferConditions(false);
            }
        };

        router.events.on('routeChangeStart', closeAccordion);

        return () => router.events.off('routeChangeStart', closeAccordion);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showOfferConditions]);

    useEffect(() => {
        if (window?.location?.hash === Anchor.OfferConditions) {
            // wait 400ms for the page to be fully loaded
            setTimeout(() => toggleOfferConditions(true), 400);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleDesc = (): void => {
        trackHomepageAction(
            showOfferConditions ? EventTypes.FooterOfferConditionsClosed : EventTypes.FooterOfferConditionsOpened,
            TRACK_HOMEPAGE_ACTION_PARAMS,
        );

        toggleOfferConditions(!showOfferConditions);
    };

    const handleDescriptionClick = e => {
        const name = e.target.innerText;

        trackHomepageAction(EventTypes.FooterOfferConditions, {
            location: 'Offer conditions',
            name,
        });
    };

    return (
        <div className='footer-copyright footer--grey'>
            <div className='wrapper-container wrapper-container--px'>
                <div className='footer__row row'>
                    <div className='col-auto' id={getIdFromAnchor(Anchor.OfferConditions)}>
                        {!!fields?.LinkText?.value && (
                            <AccordionButton
                                onClick={toggleDesc}
                                buttonContent={fields.LinkText.value}
                                isExpanded={showOfferConditions}
                                panelId={TERMS_PANEL_ID}
                                data-tid='footer-terms-button'
                                className='terms__toggle-btn'
                            />
                        )}
                    </div>

                    <div className={styles.iconsContainer}>
                        <Placeholder name={PlaceholderNames.FooterColumnInner} rendering={rendering} />
                    </div>
                </div>

                {fields?.Description && (
                    <div
                        id={TERMS_PANEL_ID}
                        className={classNames(
                            'terms__description',
                            showOfferConditions && 'terms__description--active',
                        )}
                    >
                        <RichTextWithLinks
                            field={fields.Description}
                            onLinkClick={handleDescriptionClick}
                            data-tid='footer-terms-description'
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default inject((stores: TStores) => ({
    showOfferConditions: stores.appStore.showOfferConditions,
    toggleOfferConditions: stores.appStore.toggleOfferConditions,
    trackHomepageAction: stores.trackingStore.trackHomepageAction,
}))(observer(PageFooterCopyright));
