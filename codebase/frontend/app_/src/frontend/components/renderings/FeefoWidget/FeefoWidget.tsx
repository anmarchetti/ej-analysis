import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import { IComponentWithRerenderProps, withRerender } from 'frontend/components/hoc/withRerender';

import { ScrollDirectionLabels, useScrollDirection } from './useScrollDirection';

import styles from './FeefoWidget.module.scss';

interface IFeefoWidgetFields {
    Image: ISitecoreField<ISitecoreImage>;
    Url: ISitecoreField<ISitecoreLink>;
}

export interface IFeefoWidgetProps extends ISitecoreComponent<IFeefoWidgetFields>, IComponentWithRerenderProps {}

export const FeefoWidget: FunctionComponent<IFeefoWidgetProps> = ({ fields, wasRerendered }: IFeefoWidgetProps) => {
    const experiment = useExperiment(ExperimentTestIds.Ffo);
    const autoHideVariantA = experiment?.testVariant === ExperimentVariants.VariantA;
    const { scrollDirection } = useScrollDirection(autoHideVariantA);

    const { isScreenExtraSmall, isEditMode, trackEventWithParams } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    if (
        !experiment?.testId ||
        !experiment?.testVariant ||
        !fields ||
        (wasRerendered && isScreenExtraSmall) ||
        isEditMode ||
        (autoHideVariantA && scrollDirection === ScrollDirectionLabels.Down)
    )
        return null;

    const { Image, Url } = fields;

    const onLinkClick = () => {
        trackEventWithParams(EventTypes.GenericEvent, {
            eventCategory: EventCategories.FeefoWidget,
            eventAction: EventActions.Interacted,
            eventLabel: autoHideVariantA ? 'Widget option 1 clicked' : 'Widget option 2 clicked',
            eventType: EventTypes.Interaction,
            eventValue: null,
        });
    };

    return (
        <div className={styles.feefoWidgetContainer} data-tid='floating-widget-container'>
            <a href={Url.value.href} target={Url.value.target} rel='noreferrer' onClick={onLinkClick}>
                <img
                    src={cmsUrls.media(Image.value.src)}
                    alt={Image.value.alt}
                    role='presentation'
                    aria-label='feefo-widget'
                />
            </a>
        </div>
    );
};

export default observer(withRerender(FeefoWidget));
