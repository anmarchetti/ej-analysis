import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { InformationTilesTheme } from 'models/enum/InformationTilesTheme';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import RouterLink from 'frontend/components/common/RouterLink';
import useOptimizelyData from 'frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyData';
import { IExperimentConfig } from 'frontend/components/cro/ExperimentOptimizely/models';
import { getActiveVariantAndMatchedConfig } from 'frontend/components/cro/ExperimentOptimizely/utils/experiment.utils';
import { withRerender } from 'frontend/components/hoc';
import { IConfidenceModuleTransformerFields } from 'frontend/components/renderings/ConfidenceModuleTransformer';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import WhyBookWithUsCarouselComponent from './components/WhyBookWithUsCarouselComponent/WhyBookWithUsCarouselComponent';

import styles from './WhyBookWithUsCarousel.module.scss';

export type TWhyBookWithUsCarouselProps = ISitecoreComponent<IConfidenceModuleTransformerFields>;

export const WhyBookWithUsCarousel: React.FC<TWhyBookWithUsCarouselProps> = ({ fields, rendering }) => {
    const { isScreenMedium } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
    }));
    const optimizelyData = useOptimizelyData();

    if (!optimizelyData || !fields) {
        return null;
    }

    const { ConfidenceLink, ConfidenceTitle, ConfidenceInfoTiles } = fields || {};

    // This is a AB test related - EHD-350 - Component not presented without Optimazely settings
    const experimentConfigs: IExperimentConfig[] = [
        {
            experimentId: '27307180800',
            pagesId: '27384830109',
            originalVariant: '27400090027',
            variantA: '27276460698',
        },
        {
            experimentId: '27396270005',
            pagesId: '27451970994',
            originalVariant: '27324480482',
            variantA: '27293810666',
        },
    ];

    const { activeVariantId, config } = getActiveVariantAndMatchedConfig(experimentConfigs, optimizelyData);
    const isABTest = activeVariantId && config?.variantA === activeVariantId;

    if (!isABTest) return null;

    const carouselItems = (ConfidenceInfoTiles || []).map(item => ({
        fields: { ...item.fields },
        id: item.id,
        name: item?.fields?.Title?.value || '',
        displayName: item?.fields?.Title?.value || '',
    }));
    const isLinkExists = !!ConfidenceLink?.value?.text && !!ConfidenceLink?.value?.href;
    const isShowRouteLinkOnMobileScreen = isLinkExists && !isScreenMedium;
    const isShowRouteLinkOnDesktop = isLinkExists && isScreenMedium;

    return (
        <ComponentWrapper params={{ IsGreyBackground: '1' }}>
            <div className={styles.container} data-tid='container'>
                <div className={!isScreenMedium ? styles.mobile : styles.desktop}>
                    <div>
                        {!!ConfidenceTitle && (
                            <Text
                                field={ConfidenceTitle}
                                tag='h2'
                                className={styles.containerTitle}
                                data-tid={'containerTitle'}
                            />
                        )}
                        {isShowRouteLinkOnDesktop && (
                            <RouterLink link={ConfidenceLink} className='btn--txt'>
                                {ConfidenceLink.value?.text}
                            </RouterLink>
                        )}
                    </div>
                </div>
                <WhyBookWithUsCarouselComponent
                    data-tid={'carousel'}
                    fields={{ Children: carouselItems }}
                    params={{
                        Theme: InformationTilesTheme.GlobalVariant,
                    }}
                    rendering={rendering}
                />
                {isShowRouteLinkOnMobileScreen && (
                    <RouterLink
                        link={ConfidenceLink}
                        className={classNames('btn btn--small btn--outlined ', styles.mobileButton)}
                        data-tid={'mobileButton'}
                    >
                        {ConfidenceLink.value?.text}
                    </RouterLink>
                )}
            </div>
        </ComponentWrapper>
    );
};

export default withRerender(observer(WhyBookWithUsCarousel));
