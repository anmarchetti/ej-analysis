import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useLuxuryInternalFlightDefaultBagsLabel } from 'frontend/hooks/useLuxuryInternalFlight';
import { IExtraLuggageContent, ILuggageInfoItem } from 'models/data/IFlightExtras';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { getLuggageInfoItems } from './LuggageInfo.utils';

import styles from './LuggageInfo.module.scss';

export interface ILuggageInfoFields {
    LuggageInfoTitle: ISitecoreField<string>;
    PramName: ISitecoreField<string>;
    SportEquipmentsLabel: ISitecoreField<string>;
}

export interface ILuggageInfoProps {
    defaultBagsOneDirection: ILuggageInfoItem[];
    extraLuggageFullInfo: Record<string, IExtraLuggageContent>[];
    fields: ILuggageInfoFields | undefined;
    guestWithHoldLuggage: number;
    infantsNumber: number;
    hideTitle?: boolean;
    titleClassName?: string;
}

const LuggageInfo: FC<ILuggageInfoProps> = ({
    fields,
    titleClassName,
    infantsNumber,
    defaultBagsOneDirection,
    extraLuggageFullInfo,
    hideTitle,
    guestWithHoldLuggage,
}) => {
    const { LuggageInfoTitle, PramName, SportEquipmentsLabel } = fields || {};

    const items = getLuggageInfoItems({
        infantsNumber,
        extraLuggageFullInfo,
        pramLabel: PramName?.value || '',
        sportEquipmentsLabel: SportEquipmentsLabel?.value || '',
        defaultBagsOneDirection,
        luxuryInternalFlightBagsLabel: useLuxuryInternalFlightDefaultBagsLabel(guestWithHoldLuggage),
    });

    return (
        <div data-cs-mask>
            <div className={styles.container} data-tid='hold-luggage-info'>
                {!hideTitle && (
                    <Text
                        field={LuggageInfoTitle}
                        className={classNames(styles.title, titleClassName)}
                        tag='h3'
                        data-tid='hold-luggage-info-title'
                    />
                )}
                <div data-tid='hold-luggage'>
                    {items.map((item, index) => (
                        <div key={index} className={styles.line} data-tid={item.dataTid}>
                            {item.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LuggageInfo;
