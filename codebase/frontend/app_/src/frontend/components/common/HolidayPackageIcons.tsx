import { FC, Fragment } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { filterPackageIcons } from 'frontend/utils/offer.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IThemePackageIcon } from 'models/data/IHotel';
import { ITransfer } from 'models/data/ITransfer';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import IconPlusAlt from 'frontend/components/icons-new/PlusAlt';

import { JSSImageNext } from './JSSImageNext/JSSImageNext';

interface IHolidayPackageIconsProps {
    extraLuggage: Nullable<IExtraLuggageInfo>;
    packageIcons: IThemePackageIcon[];
    transfer: Nullable<ITransfer>;
    className?: string;
    extraIcon?: IThemePackageIcon;
    hideTitle?: boolean;
    iconClassName?: string;
    isLuxuryPackage?: boolean;
}

const separator = (
    <div className='icons-summ__plus-box'>
        <IconPlusAlt />
    </div>
);

const ICON_SIZE = 24;

const HolidayPackageIcons: FC<IHolidayPackageIconsProps> = ({
    packageIcons,
    transfer,
    hideTitle,
    extraLuggage,
    className,
    iconClassName,
    extraIcon,
    isLuxuryPackage,
}) => {
    const { isHotelPreview, getPhrase } = useStore(({ layoutStore }: TStores) => ({
        isHotelPreview: layoutStore.isHotelDetailsBrowsePagePreview,
        getPhrase: layoutStore.getPhrase,
    }));

    const bagName = isLuxuryPackage ? getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagPlural) : undefined;
    const icons = filterPackageIcons(packageIcons, transfer, extraLuggage, bagName);

    if (extraIcon) {
        icons.push(extraIcon);
    }

    if (!icons.length || isHotelPreview) {
        return null;
    }

    return (
        <div className={classNames('hotel-card__icons-summ', className)}>
            {icons.map((icon, i) => (
                <Fragment key={`${icon.key}-${i}`}>
                    <div className='icons-summ__icon-item'>
                        <div className={iconClassName} data-tid='holiday-package-icon-wrapper'>
                            <JSSImageNext
                                field={{ value: { src: icon.iconUrl } }}
                                mediaSize={MediaSize.Small}
                                width={ICON_SIZE}
                                height={ICON_SIZE}
                                data-tid={`${icon.key}_icon`}
                                className='icon--bg-image'
                            />
                        </div>
                        <div className={classNames('title', hideTitle && 'visually-hidden')}>{icon.name}</div>
                    </div>
                    {i < icons.length - 1 && separator}
                </Fragment>
            ))}
        </div>
    );
};

export default observer(HolidayPackageIcons);
