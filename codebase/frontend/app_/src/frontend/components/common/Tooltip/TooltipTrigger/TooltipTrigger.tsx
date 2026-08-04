import { cloneElement, forwardRef, HTMLProps, isValidElement, ReactNode } from 'react';
import { useMergeRefs } from '@floating-ui/react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { useTooltipContext } from 'frontend/components/common/Tooltip/Tooltip.utils';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import styles from './TooltipTrigger.module.scss';

type TTooltipTriggerProps = HTMLProps<HTMLElement> & { children?: ReactNode };

const TooltipTrigger = forwardRef<HTMLElement, TTooltipTriggerProps>(({ children, className, ...props }, propRef) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));
    const { refs, getReferenceProps, open: isDisplayed, tooltipId } = useTooltipContext();
    const ref = useMergeRefs([refs.setReference, propRef]);

    const status = isDisplayed ? 'open' : 'closed';

    if (isValidElement(children)) {
        return cloneElement(
            children,
            getReferenceProps({
                ref,
                ...props,
                ...children.props,
                'data-state': status,
                'aria-describedby': tooltipId,
            }),
        );
    }

    return (
        <button
            ref={ref}
            className={classNames(styles.iconWrapper, className, 'no-print')}
            aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsTooltipTrigger)}
            data-state={status}
            data-tid='default-tooltip-trigger'
            {...getReferenceProps(props)}
            aria-describedby={tooltipId}
            type='button'
        >
            <IconInfoCircle />
        </button>
    );
});

export default TooltipTrigger;
