import { Placement } from '@floating-ui/utils';

export const mockTooltipContextData = {
    refs: {
        setReference: jest.fn(),
        setFloating: jest.fn(),
        floating: { current: null },
        reference: { current: null },
    } as any,
    getReferenceProps: jest.fn(props => props),
    open: false,
    isAnimationLaunched: false,
    arrowRef: { current: null },
    setIsAnimationLaunched: jest.fn(),
    setOpen: jest.fn(),
    context: {} as any,
    elements: {} as any,
    floatingStyles: {},
    getFloatingProps: jest.fn(),
    middlewareData: {},
    placement: 'top' as Placement,
    x: 0,
    y: 0,
    tooltipId: 'floating-id-mock',
};
