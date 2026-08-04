import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import TerminalInfo, { ITerminalInfoProps } from './TerminalInfo';

expect.extend(toHaveNoViolations);

const createProps = (): ITerminalInfoProps => ({
    fields: {
        TerminalLabel: mockSitecoreField('Terminal info'),
        TerminalTooltipText: mockSitecoreField(
            'Terminal information is not available online. Please check at the airport for the latest details!',
        ),
    },
});

let mockProps: ITerminalInfoProps;
const mockStores = createMockStores();

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCalloutProps(props);

        return <div data-tid='callout' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text' />;
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: fn => fn(mockStores),
}));

describe('TerminalInfo', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMobileViewport = true;
    });

    it('should render terminal info when available', () => {
        mockProps.terminal = 'North Terminal';
        const { container } = render(<TerminalInfo {...mockProps} />);

        expect(container).toHaveTextContent(mockProps.terminal);
    });

    it('should NOT render when fields undefined', () => {
        mockProps.fields = undefined;
        const { container } = render(<TerminalInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title', () => {
        render(<TerminalInfo {...mockProps} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields!.TerminalLabel,
            tag: 'div',
            className: 'emptyTerminal',
        });
    });

    it('should call Callout with correct props on desktop', () => {
        mockUseMobileViewport = false;
        render(<TerminalInfo {...mockProps} />);

        expect(mockCalloutProps).toHaveBeenCalledWith(
            expect.objectContaining({
                orientation: CalloutOrientation.Bottom,
                position: CalloutPosition.Right,
                isShownOnHover: true,
            }),
        );
    });

    it('should call Callout with isDrawerVariant and drawerTitle on mobile', () => {
        mockUseMobileViewport = true;
        render(<TerminalInfo {...mockProps} />);

        expect(mockCalloutProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isDrawerVariant: true,
                drawerTitle: mockProps.fields?.TerminalLabel,
                footerClassName: 'drawerFooter',
                content: expect.anything(),
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<TerminalInfo {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
