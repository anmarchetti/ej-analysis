import { FC } from 'react';

import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

export interface IFastTrackInfoFields {
    FastTrackLabel?: ISitecoreField<string>;
    FastTrackLogo?: ISitecoreField<ISitecoreImage>;
}

export interface IFastTrackInfoProps {
    count: number;
    fields: IFastTrackInfoFields;
    containerClassName?: string;
    hideIcon?: boolean;
    iconClassName?: string;
}

const FastTrackInfo: FC<IFastTrackInfoProps> = ({
    count,
    fields,
    containerClassName,
    iconClassName,
    hideIcon = false,
}) => {
    if (!count) {
        return null;
    }

    const { FastTrackLabel, FastTrackLogo } = fields;

    const label = Tokenizer.replaceToken(FastTrackLabel?.value, Tokens.Count, count.toString());

    return (
        <div className={containerClassName} data-tid='fast-track-info'>
            {!hideIcon && (
                <JSSImage
                    field={FastTrackLogo}
                    className={iconClassName}
                    alt='fast track logo'
                    data-tid='fast-track-icon'
                />
            )}
            <span>{label}</span>
        </div>
    );
};

export default FastTrackInfo;
