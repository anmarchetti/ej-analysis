import { FC, PropsWithChildren } from 'react';
import { Placement } from '@floating-ui/react';

import { TooltipContext, useTooltip } from './Tooltip.utils';

interface ITooltipOptions {
    animation?: boolean;
    initialIsAnimationLaunched?: boolean;
    initialOpen?: boolean;
    placement?: Placement;
}

export const Tooltip: FC<PropsWithChildren<ITooltipOptions>> = ({ children, ...options }) => {
    const tooltip = useTooltip(options);

    return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

export default Tooltip;
