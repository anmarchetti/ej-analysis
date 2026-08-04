import { FC } from 'react';
import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IErrorFields } from 'models/data/IHolidayInspiration';
import { MediaSize } from 'models/data/MediaSizeParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import styles from './ErrorTab.module.scss';

export type TErrorTabProps = ISitecoreComponent<IErrorFields>;

const ErrorTab: FC<TErrorTabProps> = ({ fields }) => {
    const { redirectTo, trackEventWithParams, sitePath, isEditMode } = useStore((stores: IHolidaysStores) => ({
        redirectTo: stores.routerStore.redirectTo,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        sitePath: stores.layoutStore.sitePath,
        isEditMode: stores.layoutStore.isEditMode,
    }));

    const isMobile = useMobileViewport();

    if (!fields) {
        return null;
    }

    const { Title, Description, RedirectCTA, RefreshCTALabel } = fields;

    const refreshPageHandler = () => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: 'Refresh Page',
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
        window.location.reload();
    };

    const onActionClick = () => {
        if (!RedirectCTA?.value?.href) {
            return;
        }

        redirectTo(RedirectCTA.value.href);
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: RedirectCTA?.value?.title,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: `${sitePath}${RedirectCTA.value.href}`,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
    };

    return (
        <div
            className={classNames(commonStyles.questionWrapper, styles.wrapper)}
            style={getSitecoreImageBackgroundStyles(fields?.BackgroundImage, MediaSize.Small, isMobile, isEditMode)}
        >
            <JSSImage field={fields?.WarningIcon} className={styles.icon} />
            <Text tag='h2' field={Title} className={styles.title} data-tid='error-tab-title' />
            <Text tag='p' field={Description} className={styles.description} data-tid='error-tab-description' />
            <div className={styles.buttons}>
                <Button
                    className={styles.firstButton}
                    onClick={onActionClick}
                    data-tid='error-tab-action-button'
                    disabled={!RedirectCTA?.value?.href}
                >
                    {RedirectCTA?.value?.text}
                </Button>
                <Button isOutlined onClick={refreshPageHandler} data-tid='error-tab-refresh-button'>
                    {RefreshCTALabel?.value}
                </Button>
            </div>
        </div>
    );
};

export default observer(ErrorTab);
