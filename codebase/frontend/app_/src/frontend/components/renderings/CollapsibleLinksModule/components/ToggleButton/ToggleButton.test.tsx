import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { collapsibleLinksParamsMock } from 'frontend/components/renderings/CollapsibleLinksModule/__mocks__/collapsibleLinksMocks';

import { IToggleButtonProps, ToggleButton } from './ToggleButton';

jest.mock('frontend/components/icons-new/ChevronRight', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-right' />,
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: props => <div data-tid='chevron-down' {...props} />,
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return <button onClick={props.onClick}>{props.children}</button>;
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseMobileViewport,
}));

const createProps = (): IToggleButtonProps => ({
    moduleTitle: 'Title',
    params: collapsibleLinksParamsMock,
    rendUid: '123',
    drawerContentRef: React.createRef(),
    isBlockExpanded: false,
    setIsBlockExpanded: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('ToggleButton', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    describe('drawer button', () => {
        beforeEach(() => {
            mockProps.isDrawerBtn = true;
        });

        it('should render drawer button when isDrawerBtn is true', () => {
            render(<ToggleButton {...mockProps} />);

            expect(mockButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isTransparent: true,
                    isFullWidth: true,
                }),
            );
            expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
        });

        it('calls setIsBlockExpanded with false when button is clicked', async () => {
            render(<ToggleButton {...mockProps} />);

            const button = screen.getByRole('button');

            await userEvent.click(button);

            expect(mockProps.setIsBlockExpanded).toHaveBeenCalledWith(false);
        });
    });

    describe('getButtonText', () => {
        it('should render GlobalsLabelsShowLess text when isBlockExpanded = true AND isExtraSmall = false', () => {
            mockProps.isBlockExpanded = true;

            render(<ToggleButton {...mockProps} />);

            expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsLabelsShowLess);
        });

        it('should render GlobalsLabelsShowMore text when isBlockExpanded = true AND isExtraSmall = true', () => {
            mockProps.isBlockExpanded = true;
            mockUseMobileViewport = true;

            render(<ToggleButton {...mockProps} />);

            expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsLabelsShowMore);

            mockUseMobileViewport = false;
        });

        it('should render GlobalsLabelsShowMore text when isBlockExpanded = false', () => {
            mockProps.isBlockExpanded = false;

            render(<ToggleButton {...mockProps} />);

            expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsLabelsShowMore);
        });
    });

    describe('button icon', () => {
        it('should render SvgChevronRight when isExtraSmall=true', () => {
            mockUseMobileViewport = true;

            render(<ToggleButton {...mockProps} />);

            expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
        });

        it('should render SvgChevronRight when isExtraSmall=false', () => {
            mockUseMobileViewport = false;

            render(<ToggleButton {...mockProps} />);

            expect(screen.getByTestId('chevron-down')).not.toHaveClass('icon--reflect-y');
        });

        it('should render SvgChevronRight with icon--reflect-y when isExtraSmall=false AND isBlockExpanded=true', () => {
            mockProps.isBlockExpanded = true;

            render(<ToggleButton {...mockProps} />);

            expect(screen.getByTestId('chevron-down')).toHaveClass('icon--reflect-y');
        });
    });

    describe('trackModuleClick', () => {
        it('should call when IsModuleClickTrackingEnabled=1', async () => {
            render(<ToggleButton {...mockProps} />);

            const button = screen.getByRole('button');

            await userEvent.click(button);

            expect(mockStores.trackingStore.trackModuleClick).toHaveBeenCalledWith({
                moduleId: mockProps.rendUid,
                name: mockProps.moduleTitle,
                location: mockProps.params.ModuleLocation,
                selection: SitecoreDictionary.GlobalsLabelsShowMore,
                destinationPath: '',
            });
        });

        it('should NOT call when IsModuleClickTrackingEnabled=0', async () => {
            mockProps.params.IsModuleClickTrackingEnabled = '0';

            render(<ToggleButton {...mockProps} />);

            const button = screen.getByRole('button');

            await userEvent.click(button);

            expect(mockStores.trackingStore.trackModuleClick).not.toHaveBeenCalled();
        });
    });
});
