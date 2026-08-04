import {
    createContext,
    CSSProperties,
    Dispatch,
    HTMLProps,
    MutableRefObject,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    arrow,
    autoUpdate,
    ExtendedElements,
    ExtendedRefs,
    flip,
    FloatingContext,
    hide,
    MiddlewareData,
    offset,
    Placement,
    ReferenceType,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useFocus,
    useHover,
    useId,
    useInteractions,
    useRole,
    VirtualElement,
} from '@floating-ui/react';

import { useMoreThenDesktopViewport } from 'frontend/hooks/useMediaQuery';

type TContextType = ReturnType<typeof useTooltip> | null;

export const TooltipContext = createContext<TContextType>(null);

export const useTooltipContext = (): IUseTooltipData => {
    const context = useContext(TooltipContext);

    if (!context) {
        throw new Error('Tooltip components must be wrapped in <Tooltip />');
    }

    return context;
};

interface ITooltipOptions {
    initialIsAnimationLaunched?: boolean;
    initialOpen?: boolean;
    placement?: Placement;
}

export interface IUseTooltipData {
    arrowRef: MutableRefObject<null>;
    context: FloatingContext<Element | VirtualElement>;
    elements: {
        floating: HTMLElement | null;
        reference: ReferenceType | null;
    } & ExtendedElements<Element | VirtualElement>;
    floatingStyles: CSSProperties;
    getFloatingProps: (userProps?: HTMLProps<HTMLElement>) => Record<string, unknown>;
    getReferenceProps: (userProps?: HTMLProps<Element>) => Record<string, unknown>;
    isAnimationLaunched: undefined | boolean;
    middlewareData: MiddlewareData;
    open: undefined | boolean;
    placement: Placement;
    refs: {
        floating: MutableRefObject<HTMLElement | null>;
        reference: MutableRefObject<ReferenceType | null>;
        setFloating: (node: HTMLElement | null) => void;
        setReference: (node: ReferenceType | null) => void;
    } & ExtendedRefs<Element | VirtualElement>;
    setIsAnimationLaunched: Dispatch<SetStateAction<boolean>>;
    setOpen: Dispatch<SetStateAction<boolean>>;
    tooltipId: string;
    x: number;
    y: number;
}

export const useTooltip = ({
    initialOpen = false,
    placement = 'top',
    initialIsAnimationLaunched = true,
}: ITooltipOptions = {}): IUseTooltipData => {
    const arrowRef = useRef(null);
    const tooltipId = useId();

    const [open, setOpen] = useState(initialOpen);
    const [flipPadding, setFlipPadding] = useState(30);
    const [isAnimationLaunched, setIsAnimationLaunched] = useState(initialIsAnimationLaunched);

    const isDesktop = useMoreThenDesktopViewport();

    const data = useFloating({
        placement,
        open,
        onOpenChange: setOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(10),
            flip({
                crossAxis: placement.includes('-'),
                fallbackAxisSideDirection: 'start',
                padding: {
                    top: flipPadding,
                },
            }),
            shift({
                padding: {
                    top: 30,
                    right: 0,
                },
            }),
            arrow({
                element: arrowRef,
                padding: 15,
            }),
            hide(),
        ],
    });

    // We currently use a hack to avoid tooltips being overlapped by the sticky-box.
    // Since the sticky box is present on almost every page and there are many
    // tooltips with different placements, we calculate the sticky-box
    // height and set the flip padding dynamically based on that.
    //
    // We need to come up with a more universal solution that can
    // handle a wider range of dynamic overlap scenarios.
    useEffect(() => {
        // If the tooltips are inside a popup, then ignore the presence of the sticky box in the background.
        const isModalDisplayed = document.getElementById('modal-portal-root')?.hasChildNodes();
        const ignoreIfAnyModalDisplayed = isModalDisplayed && isDesktop;

        if (!isDesktop || !open || ignoreIfAnyModalDisplayed) return;

        const boxes = Array.from(document.querySelectorAll('#sticky-box'));

        const { bottom } = boxes[boxes.length - 1]?.getBoundingClientRect() ?? {
            bottom: 0,
        };

        if (bottom) {
            setFlipPadding(bottom);
        }
    }, [isDesktop, open]);

    useEffect(() => {
        // turn off tooltip once the reference is hidden (for example by scrolling)
        if (data.middlewareData.hide?.referenceHidden && isDesktop) {
            setOpen(false);
        }
    }, [data.middlewareData.hide?.referenceHidden]);

    const context = data.context;

    const hover = useHover(context, {
        move: false,
        enabled: isDesktop,
    });

    const focus = useFocus(context, {
        enabled: isDesktop,
    });

    const dismiss = useDismiss(context, {
        enabled: isDesktop,
    });
    const role = useRole(context, { role: isDesktop ? 'tooltip' : 'dialog' });
    const click = useClick(context, { enabled: true, ignoreMouse: isDesktop, keyboardHandlers: true });

    const interactions = useInteractions([hover, focus, dismiss, role, click]);

    const tooltipData = useMemo(
        () => ({
            ...interactions,
            ...data,
        }),
        [interactions, data],
    );

    return {
        open,
        setOpen,
        arrowRef,
        isAnimationLaunched,
        setIsAnimationLaunched,
        tooltipId,
        ...tooltipData,
    };
};
