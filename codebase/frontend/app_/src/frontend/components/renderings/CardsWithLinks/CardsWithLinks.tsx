import React, { useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ICustomisableComponentParamsWithTitleTag } from 'models/data/ICustomisableComponentParams';
import { IPromoBlockBaseFields, IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';
import PromoBlocks, { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';

export interface ICardsWithLinksFields {
    Children: ISitecoreChildren<IPromoBlockBaseFields>[];
    Link: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

type TCardsWithLinksProps = ISitecoreComponent<ICardsWithLinksFields, ICustomisableComponentParamsWithTitleTag>;

export const CardsWithLinks: React.FC<TCardsWithLinksProps> = ({ fields, params, rendering }) => {
    const { trackHolidayTypesHubEvents, isHolidayTypePage, sitePath } = useStore((stores: TStores) => ({
        trackHolidayTypesHubEvents: stores.trackingStore.trackHolidayTypesHubEvents,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        sitePath: stores.layoutStore.sitePath,
    }));

    const promoBlocksNames = (fields?.Children || []).reduce((acc, item) => {
        if (item.fields) {
            acc.push(item.fields.Title.value);
        }

        return acc;
    }, [] as Array<string>);

    useEffect(() => {
        if (isHolidayTypePage && !!fields && !!promoBlocksNames.length) {
            trackHolidayTypesHubEvents(EventTypes.ShowSimilarDeals, {
                name: promoBlocksNames.join('|'),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fields) {
        return null;
    }

    return (
        <div className={classNames('promo-blocks-section', getPaddingSizeClassName(params?.PaddingSize))}>
            {!!fields.Title && (
                <Text
                    field={fields.Title}
                    tag={params?.TitleTag || 'h2'}
                    className={getCustomisableTitleClassName(
                        `promo-blocks-section__title ${!params?.TitlePosition && 'text-center'}`,
                        params,
                    )}
                />
            )}

            {!!fields.Children?.length && (
                <div>
                    <PromoBlocks
                        isUsedAsComponent
                        onClickItem={(item: IPromoBlockFields): false | void | '' =>
                            isHolidayTypePage &&
                            item.fields.Title?.value &&
                            item.fields.Link &&
                            trackHolidayTypesHubEvents(EventTypes.SimilarDealsClick, {
                                name: item.fields.Title?.value,
                                destination: buildSitecoreLinkFullUrl(item.fields.Link, sitePath),
                            })
                        }
                        fields={{ Children: fields.Children }}
                        params={
                            {
                                Theme: PromoBlocksThemes.Big,
                                HasImageDarkOverlay: '1',
                                TitlePlacement: BigVariantTitlePlacementOptions.TitleOverImage,
                            } as IPromoBlocksParams
                        }
                        rendering={rendering}
                    />
                </div>
            )}

            {!!fields.Link?.value?.href && (
                <div className='promo-blocks-section__cta'>
                    <RouterLink
                        className='btn btn--outlined btn--medium '
                        link={fields.Link}
                        onClick={(): false | void =>
                            isHolidayTypePage &&
                            trackHolidayTypesHubEvents(EventTypes.CTAClick, {
                                position: 'Bottom',
                                name: fields.Link?.value?.text,
                                destination: buildSitecoreLinkFullUrl(fields.Link, sitePath),
                            })
                        }
                    >
                        {fields.Link.value.text}
                    </RouterLink>
                </div>
            )}
        </div>
    );
};

export default CardsWithLinks;
