import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockCustomisableParams } from 'frontend/__mocks__/customisableParams';
import { ModuleLocation } from 'models/enum/tracking/ModuleLocation';
import ConfidenceModuleTransformer from 'frontend/components/renderings/ConfidenceModuleTransformer';

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className, onClick }) => (
        <div className={className} onClick={onClick}>
            RouterLink
            <span>{children}</span>
        </div>
    ),
}));

const mockInformationTilesProps = jest.fn();
jest.mock('frontend/components/renderings/InformationTiles/InformationTiles', () => ({
    __esModule: true,
    default: props => {
        mockInformationTilesProps(props);

        return <div data-tid='information-tiles' />;
    },
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div>JSSImage</div>,
}));

const createStores = () => ({
    layoutStore: { isEditMode: false, sitePath: false },
    appStore: { isScreenMedium: true },
    trackingStore: { trackModuleClick: jest.fn(), trackHomepageAction: jest.fn() },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ConfidenceModuleTransformer />', () => {
    const resetMocks = () =>
        ({
            fields: {
                ConfidenceIcon: { value: { src: 'icon' } },
                ConfidenceInfoTiles: [
                    { id: '1', fields: { Title: { value: 'Tile 1' } } },
                    { id: '2', fields: { Title: { value: 'Tile 2' } } },
                ],
                ConfidenceLink: { value: { href: '/Confidence-Link', text: 'ConfidenceLink' } },
                ConfidenceText: { value: 'ConfidenceText' },
                ConfidenceTitle: { value: 'ConfidenceTitle' },
            },
            params: mockCustomisableParams,
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render confidence module', () => {
        mocks.isDefaultTheme = false;

        const { container } = render(<ConfidenceModuleTransformer {...mocks} />);

        expect(container.querySelector('.desktop-container-view')).toBeInTheDocument();
        expect(container.querySelector('.confidence-transformer__title')).toBeInTheDocument();
        expect(screen.getByText('RouterLink')).toBeInTheDocument();
        expect(screen.getByTestId('information-tiles')).toBeInTheDocument();
    });

    it('should NOT render elements if no fields', () => {
        delete mocks.fields;

        const { container } = render(<ConfidenceModuleTransformer {...mocks} />);

        expect(container.querySelector('.confidence-transformer__title')).not.toBeInTheDocument();
    });

    it('should NOT render mobile-container-view', () => {
        mocks.isScreenMedium = true;

        const { container } = render(<ConfidenceModuleTransformer {...mocks} />);

        expect(container.querySelector('.mobile-container-view')).not.toBeInTheDocument();
    });

    it('should render all customisable class names', () => {
        const { container } = render(<ConfidenceModuleTransformer {...mocks} />);

        const text = screen.getByRole('heading', { level: 2 });

        expect(text).toHaveClass('mobile-f14-desktop-f16');
        expect(text).toHaveClass('font-rounded');
        expect(text).toHaveClass('position-center');
        expect(text).toHaveClass('weight-200');
        expect(container.querySelector('.padding-24')).toBeInTheDocument();
    });

    describe('Module Click Tracking', () => {
        it('should track click on link', () => {
            mocks.rendering = { uid: 'moduleId' };
            mocks.params = {
                IsModuleClickTrackingEnabled: '1',
                ModuleLocation: ModuleLocation.TopBanner,
            };

            const { getByText } = render(<ConfidenceModuleTransformer {...mocks} />);
            const routerLink = getByText('RouterLink');

            expect(routerLink).toBeInTheDocument();

            fireEvent.click(routerLink);

            expect(mockStores.trackingStore.trackModuleClick).toBeCalledWith({
                moduleId: 'moduleId',
                name: 'ConfidenceTitle',
                location: ModuleLocation.TopBanner,
                selection: 'ConfidenceLink',
                destinationPath: '/Confidence-Link',
            });
        });

        it('should NOT track click on link', () => {
            mocks.params = null;

            const { getByText } = render(<ConfidenceModuleTransformer {...mocks} />);

            expect(getByText('RouterLink')).toBeInTheDocument();

            fireEvent.click(getByText('RouterLink'));
            expect(mockStores.trackingStore.trackModuleClick).not.toHaveBeenCalled();
        });
    });

    it('should pass isUsedAsComponent prop to InformationTiles', () => {
        render(<ConfidenceModuleTransformer {...mocks} />);

        expect(mockInformationTilesProps).toHaveBeenCalledWith(expect.objectContaining({ isUsedAsComponent: true }));
    });
});
