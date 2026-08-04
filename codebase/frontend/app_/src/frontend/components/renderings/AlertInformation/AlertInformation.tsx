import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { IQuestionAnswerFields } from 'models/data/IQuestionAnswerFields';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import TabAccordion, { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { getTabItems } from 'frontend/components/common/TabAccordion/utils/tabAccordion.utils';

import styles from './AlertInformation.module.scss';

export interface IAlertInformationFields extends IQuestionAnswerFields {
    Anchor: ISitecoreField<string>;
}

export interface IAlertInformationBlockItem extends ISitecoreComponent<IAlertInformationFields> {
    id: string;
}
interface IAlertInformationItemFields {
    Description: ISitecoreField<string>;
    Links: IAlertInformationBlockItem[];
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TAlertInformationItemProps = ISitecoreComponent<IAlertInformationItemFields>;

export const ALERT_INFO_ID = 'tradePortalAlertInformationBlock';

const AlertInformation: FC<TAlertInformationItemProps> = ({ fields }) => {
    const { alertActiveTab, trackEventWithParams, setAlertInfoLoaded } = useStore((stores: ITradePortalStores) => ({
        alertActiveTab: stores.appStore.alertActiveTab,
        setAlertInfoLoaded: stores.appStore.setAlertInfoLoaded,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const alertsItems: ITabItem[] = getTabItems(fields?.Links || []);

    const defaultSelectedTabId = fields?.Links.find(link => link.fields?.Anchor.value === alertActiveTab)?.id;

    const [selectedTab, setSelectedTab] = useState<Nullable<ITabItem>>(
        () => alertsItems.find(tab => tab.id === defaultSelectedTabId) || null,
    );

    useEffect(() => {
        setAlertInfoLoaded(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fields || fields?.Links.length === 0) {
        return null;
    }

    const { Title, Subtitle, Links } = fields;

    const onTogglePanel = (item: ITabItem): void => {
        if (!isMoreThenTabletViewport && item.id === selectedTab?.id) {
            setSelectedTab(null);
        } else {
            setSelectedTab(item);
        }

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: Title.value,
                eventCategory: EventCategories.AlertsModule,
                eventLabel: item.TitleTab?.value,
                eventType: EventTypes.Interaction,
                eventValue: 'null',
            },
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
    };

    const renderContent = (tab: ITabItem): JSX.Element | null =>
        tab.ContentTab ? (
            <RichTextWithLinks
                field={tab.ContentTab}
                tag='div'
                className={classNames('rich-editor-media', styles.content, {
                    [styles.contentHidden]: !isMoreThenTabletViewport && tab.id !== selectedTab?.id,
                })}
            />
        ) : null;

    return (
        <div>
            <section className={styles.section} id={ALERT_INFO_ID}>
                <Text className={styles.title} data-tid='alert-information-title' field={Title} tag='p' />
                <Text className={styles.subtitle} data-tid='alert-information-subtitle' field={Subtitle} tag='p' />
                {Links.length > 1 ? (
                    <TabAccordion
                        renderContent={renderContent}
                        items={alertsItems}
                        onTabClick={onTogglePanel}
                        tabAccordionClassName={styles.tabAccordionContainer}
                        defaultSelectedTabId={defaultSelectedTabId}
                        tabToggleClassName={styles.tabToggle}
                        tabToggleSelectedClassName={styles.tabToggleSelected}
                    />
                ) : (
                    <>
                        {Links.map(item => (
                            <div
                                className={styles.oneItemContainer}
                                key={item.id}
                                data-tid='alert-information-one-item-container'
                            >
                                <Text
                                    className={styles.oneItemTitle}
                                    field={item.fields?.Question}
                                    tag='p'
                                    data-tid='alert-information-one-item-title'
                                />
                                {item.fields?.Answer && (
                                    <RichTextWithLinks
                                        field={item.fields.Answer}
                                        className={styles.oneItemDescription}
                                        dataId='alert-information-one-item-description'
                                    />
                                )}
                            </div>
                        ))}
                    </>
                )}
            </section>
        </div>
    );
};

export default observer(AlertInformation);
