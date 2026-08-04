import * as React from 'react';
import { observer } from 'mobx-react';

import { ITheme, IThemeType } from 'models/data/IHotel';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { HolidayTypes } from 'models/enum/HolidayThemes';
import { Callout } from 'frontend/components/common/Callout/Callout';
import { JSSImage } from 'frontend/components/common/JSSImage';

interface IHolidayThemeProps {
    holidayTheme: Nullable<ITheme>;
    holidayType: IThemeType;
    withIcon?: boolean;
}

export const HolidayTheme = (props: IHolidayThemeProps) => {
    const image = {
        value: {
            src: props.holidayType.icon,
        },
    };

    /**Dont show Handpicked and Other according comments to EJH-13009 */
    if (
        !props.holidayType ||
        props.holidayType.name === HolidayTypes.Handpicked ||
        props.holidayType.name === HolidayTypes.Other
    ) {
        return null;
    }

    return (
        <div className='hotel-card-theme' data-tid='holiday-type'>
            {props.withIcon && props.holidayType.icon && <JSSImage field={image} />}

            <span className='pe-2'>{props.holidayType.typeAndThemeTitle || ''}</span>

            {!!props.holidayType.description && (
                <Callout
                    content={<div>{props.holidayType.description}</div>}
                    orientation={CalloutOrientation.Bottom}
                    position={CalloutPosition.Right}
                    isShownOnHover
                />
            )}
        </div>
    );
};

export default observer(HolidayTheme);
