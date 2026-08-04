import { FC } from 'react';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getHoldItemsLabel, getLuggageIcon } from 'frontend/utils/luggage.utils';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IThemePackageIcon } from 'models/data/IHotel';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SVGHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';

export interface IHoldBagsShortInfoProps {
    extraLuggageItems: ILuggageInfoItem[];
    luggageCount: number;
    luggageText: string | undefined;
    packageIcons: IThemePackageIcon[] | undefined;
}

export const HoldBagsShortInfo: FC<IHoldBagsShortInfoProps> = ({
    luggageCount,
    luggageText,
    extraLuggageItems,
    packageIcons,
}) => {
    const { getPhrase } = useStore(({ layoutStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    if (!packageIcons?.length) {
        const holdLuggageLabel = getHoldItemsLabel(luggageCount, getPhrase);

        return (
            <div className='holiday-details__item' data-tid='hold-bags'>
                <i className='holiday-details__icon'>
                    <SVGHoldBagFilled />
                </i>
                {holdLuggageLabel}
            </div>
        );
    }

    if (!luggageCount) {
        return null;
    }

    const luggageIcon = getLuggageIcon(packageIcons, extraLuggageItems);

    return (
        <div className='holiday-details__item' data-tid='luggage-included'>
            <i className='holiday-details__icon'>
                <ImageWithFilter
                    imageSrc={cmsUrls.media(luggageIcon?.iconUrl ?? '')}
                    filterMatrix={SVGFilterMatrix.Lightblack}
                    className='icon--bg-image'
                    dataTid='luggage-icon'
                />
            </i>
            {!!luggageText && (
                <span className='holiday-details__text' data-tid='luggage-label'>
                    {luggageCount}
                    &nbsp;
                    {luggageText}
                </span>
            )}
        </div>
    );
};

export default observer(HoldBagsShortInfo);
