import * as React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ITheme, IThemeType } from 'models/data/IHotel';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import Callout from './Callout/Callout';
import { JSSImage } from './JSSImage';

interface IHolidayThemeProps {
    holidayTheme: Nullable<ITheme>;
    holidayType: IThemeType;
    handleCalloutHoverState?: (isHovered: boolean) => void;
    withIcon?: boolean;
}

export const HolidayTheme: React.FC<IHolidayThemeProps> = ({
    holidayType,
    holidayTheme,
    withIcon,
    handleCalloutHoverState,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!holidayType) {
        return null;
    }

    const image = {
        value: {
            src: holidayType.icon,
        },
    };

    const label = Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.HolidayThemeTextLabelsHoliday), {
        [Tokens.HolidayTheme]: holidayTheme?.name ?? '',
        [Tokens.HolidayType]: holidayType.name,
    });

    return (
        <li className='list-item--icon' data-tid='holiday-type'>
            {withIcon && holidayType.icon && <JSSImage field={image} />}

            <div className='d-flex'>
                <span className='pe-2'>{label}</span>

                {!!holidayType.description && (
                    <Callout
                        content={<div>{holidayType.description}</div>}
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.Right}
                        isShownOnHover
                        handleCalloutHoverState={handleCalloutHoverState}
                    />
                )}
            </div>
        </li>
    );
};

export default observer(HolidayTheme);
