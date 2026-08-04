import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { DEFAULT_TIME, IReferenceItemProps, ReferenceItem } from './ReferenceItem';
import { useAdjustCopiedLabelPosition } from './referenceItem.hooks';

const createProps = (): IReferenceItemProps => ({
    title: 'title',
    referenceNumber: 'reference',
    tooltip: 'tooltip',
    dataTid: 'data-test-id',
    onClick: jest.fn(),
});

let props;
let mockStores;

jest.mock('./referenceItem.hooks', () => ({
    useAdjustCopiedLabelPosition: jest.fn().mockReturnValue({
        isNearRightEdge: false,
        isNearLeftEdge: false,
        checkPosition: jest.fn(),
    }),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonComponent(props);

        return (
            <button data-tid='btn' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockCallout = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCallout(props);

        return <div data-tid='callout' />;
    },
}));

describe('<ReferenceItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<ReferenceItem {...props} />);

        expect(screen.getByText(props.title)).toBeInTheDocument();

        expect(mockButtonComponent).toHaveBeenCalledWith({
            className: 'refNumber',
            dataTid: 'data-test-id-ref-number',
            removeDefaultClass: true,
            onClick: expect.any(Function),
            children: expect.anything(),
            'aria-label': 'Globals.Buttons.Copy title reference',
        });
        expect(screen.getByTestId('btn')).toHaveTextContent('reference');

        expect(mockCallout).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'ms-2',
                orientation: CalloutOrientation.Top,
                position: CalloutPosition.IconLeft,
                isShownOnHover: true,
            }),
        );
        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(screen.queryByTestId('no-ref-number-container')).not.toBeInTheDocument();
    });

    it('should call onCopyClick when click on reference', async () => {
        const mockCheckPosition = jest.fn();
        (useAdjustCopiedLabelPosition as any).mockReturnValueOnce({ checkPosition: mockCheckPosition });

        render(<ReferenceItem {...props} />);

        await userEvent.click(screen.getByTestId('btn'));

        expect(props.onClick).toHaveBeenCalled();
        expect(mockCheckPosition).toHaveBeenCalled();

        expect(screen.getByTestId('data-test-id-copied-tooltip')).toHaveTextContent(
            SitecoreDictionary.GlobalsLabelsCopied,
        );
    });

    it('should show and then hide copied tooltip after timeout', async () => {
        jest.useFakeTimers();
        render(<ReferenceItem {...props} />);

        await fireEvent.click(screen.getByTestId('btn'));

        const tooltip = screen.getByTestId('data-test-id-copied-tooltip');
        expect(tooltip).not.toHaveClass('alignToRight');
        expect(tooltip).not.toHaveClass('alignToLeft');
        expect(tooltip).toHaveClass('d-block');

        act(() => {
            jest.advanceTimersByTime(DEFAULT_TIME);
        });

        await waitFor(() => {
            expect(tooltip).not.toHaveClass('d-block');
        });

        jest.useRealTimers();
    });

    it('should add classes to copied tooltip on resize', async () => {
        (useAdjustCopiedLabelPosition as any).mockReturnValue({ isNearRightEdge: true, isNearLeftEdge: true });

        render(<ReferenceItem {...props} />);

        await fireEvent.click(screen.getByTestId('btn'));

        act(() => {
            jest.advanceTimersByTime(DEFAULT_TIME);
        });

        expect(screen.getByTestId('data-test-id-copied-tooltip')).toHaveClass('copiedTooltip alignToLeft alignToRight');
    });

    it('should NOT render button with reference number and render children if it is NOT provided', () => {
        props.referenceNumber = undefined;
        render(<ReferenceItem {...props} />);

        expect(screen.queryByTestId('btn')).not.toBeInTheDocument();
        expect(mockButtonComponent).not.toHaveBeenCalled();
        expect(screen.getByTestId('no-ref-number-container')).toBeInTheDocument();
    });

    it('should apply className to the container', () => {
        props.className = 'custom-class';
        render(<ReferenceItem {...props} />);

        const container = screen.getByTestId('data-test-id');
        expect(container).toHaveClass('bookingRef', 'custom-class');
    });

    it('should apply titleClassName to title wrapper', () => {
        props.titleClassName = 'custom-title-class';
        render(<ReferenceItem {...props} />);

        const titleWrapper = screen.getByTestId('data-test-id-title');
        expect(titleWrapper).toHaveClass('refTitleWrapper', 'custom-title-class');
    });

    it('should apply refNumberClassName to reference button', () => {
        props.refNumberClassName = 'custom-ref-class';
        render(<ReferenceItem {...props} />);

        expect(mockButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'refNumber custom-ref-class',
            }),
        );
    });

    it('should apply refNumberClassName to no-ref-number container when referenceNumber is not provided', () => {
        props.referenceNumber = undefined;
        props.refNumberClassName = 'custom-ref-class';
        render(<ReferenceItem {...props} />);

        const container = screen.getByTestId('no-ref-number-container');
        expect(container).toHaveClass('refNumber', 'custom-ref-class');
    });
});
