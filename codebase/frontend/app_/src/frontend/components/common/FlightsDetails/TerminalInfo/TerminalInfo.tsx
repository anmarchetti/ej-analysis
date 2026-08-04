import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Callout from 'frontend/components/common/Callout/Callout';
import IconWalkingWalking from 'frontend/components/icons-new/WalkingWalking';

import styles from './TerminalInfo.module.scss';

interface ITerminalInfoFields {
    TerminalLabel: ISitecoreField<string>;
    TerminalTooltipText: ISitecoreField<string>;
}

export interface ITerminalInfoProps {
    fields?: ITerminalInfoFields;
    terminal?: string;
}

const TerminalInfo: FC<ITerminalInfoProps> = ({ terminal, fields }) => {
    const isMobile = useMobileViewport();

    if (!fields) {
        return null;
    }

    const { TerminalLabel, TerminalTooltipText } = fields;

    if (terminal) {
        return <div className={styles.terminal}>{terminal}</div>;
    }

    const tooltipContent = (
        <>
            <IconWalkingWalking className={styles.walkingIcon} />
            <Text field={TerminalTooltipText} />
        </>
    );

    return (
        <div className={styles.container}>
            <Text field={TerminalLabel} tag='div' className={styles.emptyTerminal} />
            <Callout
                content={
                    <div className={styles.tooltipContainer} data-tid='terminal-tooltip'>
                        {tooltipContent}
                    </div>
                }
                orientation={CalloutOrientation.Bottom}
                position={CalloutPosition.Right}
                isShownOnHover
                isDrawerVariant={isMobile}
                drawerTitle={TerminalLabel}
                footerClassName={styles.drawerFooter}
            />
        </div>
    );
};

export default TerminalInfo;
