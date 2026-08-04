import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Callout from 'frontend/components/common/Callout/Callout';

import styles from './AmendGuestCardCantChangeTooltip.module.scss';

interface IAmendGuestCardCantChangeTooltipProps {
    text?: ISitecoreField<string>;
}

const AmendGuestCardCantChangeTooltip = ({ text }: IAmendGuestCardCantChangeTooltipProps) => {
    if (!text) {
        return null;
    }

    return (
        <Callout
            content={
                <div>
                    <Text field={text} className={styles.popupHeader} />
                </div>
            }
            orientation={CalloutOrientation.Top}
            position={CalloutPosition.Center}
            isShownOnHover
        />
    );
};

export default AmendGuestCardCantChangeTooltip;
