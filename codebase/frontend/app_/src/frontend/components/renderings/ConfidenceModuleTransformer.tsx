import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ICustomisableComponentParams } from 'models/data/ICustomisableComponentParams';
import { IHomepageEventParams, IModuleClickEventParams } from 'models/data/tracking/IEventWithParams';
import { ITrackingModuleClickParams } from 'models/data/tracking/ITrackingModuleClickParams';
import ConfidenceModuleTransformerTheme from 'models/enum/ConfidenceModuleTransformerTheme';
import { TextPosition } from 'models/enum/CustomisableComponentsParameters';
import { InformationTilesTheme } from 'models/enum/InformationTilesTheme';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';
import { JSSImage } from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import { IInformationTilesItemFields } from './InformationTiles/components/InformationTilesItem';
import InformationTiles from './InformationTiles/InformationTiles';

export interface IConfidenceModuleTransformerFields {
    ConfidenceIcon: ISitecoreField<ISitecoreImage>;
    ConfidenceInfoTiles: ISitecoreCompositeField<IInformationTilesItemFields>[];
    ConfidenceLink: ISitecoreField<ISitecoreLink>;
    ConfidenceText: ISitecoreField<string>;
    ConfidenceTitle: ISitecoreField<string>;
}

export interface IConfidenceModuleTransformerParams extends ITrackingModuleClickParams, ICustomisableComponentParams {
    Theme: ConfidenceModuleTransformerTheme;
}

interface IConfidenceModuleTransformerProps
    extends ISitecoreComponent<IConfidenceModuleTransformerFields, IConfidenceModuleTransformerParams>,
        IComponentWithRerenderProps {
    children: any;
    isScreenMedium: boolean;
    sitePath: string;
    trackHomepageAction: (event: EventTypes, params: IHomepageEventParams) => void;
    trackModuleClick: (eventParams: IModuleClickEventParams) => void;
}

export const ConfidenceModuleTransformer = ({
    fields,
    params,
    rendering,
    sitePath,
    isScreenMedium,
    trackModuleClick,
    trackHomepageAction,
    wasRerendered,
}: IConfidenceModuleTransformerProps) => {
    const onLinkClick = () => {
        const { ConfidenceLink } = fields || {};

        trackHomepageAction(EventTypes.ProtectionPromiseButton, {
            location: 'Protection Promise Button',
            name: ConfidenceLink?.value?.text || '',
            destination: buildSitecoreLinkFullUrl(ConfidenceLink, sitePath),
        });

        if (params?.IsModuleClickTrackingEnabled === '1') {
            const { ConfidenceTitle } = fields || {};

            trackModuleClick({
                moduleId: rendering.uid,
                name: ConfidenceTitle?.value || '',
                location: params.ModuleLocation,
                selection: ConfidenceLink?.value?.text || '',
                destinationPath: ConfidenceLink?.value?.href || '',
            });
        }
    };

    const isDefaultTheme = !!(params?.Theme === ConfidenceModuleTransformerTheme.ReasonsToBook) || !params?.Theme;

    const renderTiles = (
        <InformationTiles
            fields={{
                Children: (fields?.ConfidenceInfoTiles || []).map(item => ({
                    fields: { ...item.fields },
                    id: item.id,
                    name: item?.fields?.Title?.value || '',
                    displayName: item?.fields?.Title?.value || '',
                })),
            }}
            params={{
                Theme: InformationTilesTheme.GlobalVariant,
            }}
            rendering
            isDefaultTheme={isDefaultTheme}
            isUsedAsComponent
        />
    );

    const renderConfidenceIcon = (
        <>
            {!!fields?.ConfidenceIcon && !isDefaultTheme && (
                <JSSImage
                    field={fields.ConfidenceIcon}
                    className='confidence-transformer__icon'
                    alt=''
                    role='presentation'
                />
            )}
        </>
    );

    const renderConfidenceTitle = (
        <>
            {params?.TitlePosition === TextPosition.Center && (
                <div className='confidence-transformer__empty--container' />
            )}
            {!!fields?.ConfidenceTitle && (
                <Text
                    field={fields.ConfidenceTitle}
                    tag='h2'
                    className={getCustomisableTitleClassName('confidence-transformer__title', params)}
                />
            )}
            {!!fields?.ConfidenceLink?.value?.text &&
                !!fields?.ConfidenceLink?.value?.href &&
                isDefaultTheme &&
                wasRerendered &&
                isScreenMedium && (
                    <RouterLink link={fields.ConfidenceLink} className='btn btn--outlined' onClick={onLinkClick}>
                        {fields.ConfidenceLink.value?.text}
                    </RouterLink>
                )}
        </>
    );

    const renderConfidenceText = (
        <>
            {fields?.ConfidenceText && !isDefaultTheme && (
                <RichTextWithLinks field={fields.ConfidenceText} tag='p' className='confidence-transformer__text' />
            )}
        </>
    );

    const renderConfidenceModule = (
        <div
            className={classNames(
                'confidence-transformer',
                'confidence-transformer--mobile-carousel',
                isDefaultTheme && 'default-theme',
                params?.Theme === ConfidenceModuleTransformerTheme.SeparatedHeaderAndTiles &&
                    'confidence-transformer--separated-view',
                getPaddingSizeClassName(params?.PaddingSize),
            )}
        >
            {wasRerendered && !isScreenMedium ? (
                <>
                    {params?.Theme === ConfidenceModuleTransformerTheme.SeparatedHeaderAndTiles ? (
                        <div className='mobile-container-view'>
                            {renderConfidenceIcon}
                            <div>
                                {renderConfidenceTitle}
                                {renderConfidenceText}
                            </div>
                        </div>
                    ) : (
                        <>
                            {renderConfidenceIcon}
                            {renderConfidenceTitle}
                            {renderConfidenceText}
                        </>
                    )}
                </>
            ) : (
                <div className='desktop-container-view'>
                    <div>
                        {renderConfidenceIcon}
                        {renderConfidenceTitle}
                    </div>
                    {fields?.ConfidenceText && !isDefaultTheme && (
                        <RichTextWithLinks
                            field={fields.ConfidenceText}
                            tag='p'
                            className='confidence-transformer__text'
                        />
                    )}
                </div>
            )}

            {renderTiles}
            {!!fields?.ConfidenceLink?.value?.text &&
                !!fields?.ConfidenceLink?.value?.href &&
                ((wasRerendered && !isScreenMedium && isDefaultTheme) || !isDefaultTheme) && (
                    <RouterLink link={fields.ConfidenceLink} className='btn btn--outlined' onClick={onLinkClick}>
                        {fields.ConfidenceLink.value?.text}
                    </RouterLink>
                )}
        </div>
    );

    return renderConfidenceModule;
};

export default inject((stores: TStores) => ({
    isScreenMedium: stores.appStore.isScreenMedium,
    trackModuleClick: stores.trackingStore.trackModuleClick,
    trackHomepageAction: stores.trackingStore.trackHomepageAction,
    sitePath: stores.layoutStore.sitePath,
}))(withRerender(observer(ConfidenceModuleTransformer)));
