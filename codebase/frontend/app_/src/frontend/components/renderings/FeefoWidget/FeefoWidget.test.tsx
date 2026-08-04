import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';

import { FeefoWidget, IFeefoWidgetProps } from './FeefoWidget';

jest.mock('frontend/components/cro/Experiment/hooks/useExperiment');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseExperiment = useExperiment as jest.MockedFn<typeof useExperiment>;

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
        isSearchResultsPage: true,
    },
    appStore: {
        isScreenExtraSmall: false,
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
});

const resetMocks = (): IFeefoWidgetProps => ({
    wasRerendered: true,
    fields: {
        Image: mockSitecoreField(mockSitecoreImageField('image')),
        Url: mockSitecoreField(mockSitecoreLinkField('/', 'link', SitecoreLinkType.External)),
    },
    rendering: {},
    params: {},
});

let mocks = resetMocks();
let mockStores = createStores();

describe('<FeefoWidget />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('Should not render in editMode', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<FeefoWidget {...mocks} />);
        expect(screen.queryByTestId('floating-widget-container')).not.toBeInTheDocument();
    });

    it('Should only render on Search Results Page', () => {
        mockStores.layoutStore.isSearchResultsPage = false;
        render(<FeefoWidget {...mocks} />);
        expect(screen.queryByTestId('floating-widget-container')).not.toBeInTheDocument();
    });

    it('Widget should not render', () => {
        mockUseExperiment.mockReturnValue({
            testId: '',
            testVariant: '',
        });

        render(<FeefoWidget {...mocks} />);
        expect(screen.queryByTestId('floating-widget-container')).not.toBeInTheDocument();
    });

    it('Widget should not render on Mobile', () => {
        mockUseExperiment.mockReturnValue({
            testId: ExperimentTestIds.Ffo,
            testVariant: ExperimentVariants.VariantA,
        });
        mockStores.appStore.isScreenExtraSmall = true;
        render(<FeefoWidget {...mocks} />);
        expect(screen.queryByTestId('floating-widget-container')).not.toBeInTheDocument();
    });

    it('VariantA render', () => {
        mockUseExperiment.mockReturnValue({
            testId: ExperimentTestIds.Ffo,
            testVariant: ExperimentVariants.VariantA,
        });

        render(<FeefoWidget {...mocks} />);
        expect(screen.getByTestId('floating-widget-container')).toBeInTheDocument();
    });

    it('VariantB render', () => {
        mockUseExperiment.mockReturnValue({
            testId: ExperimentTestIds.Ffo,
            testVariant: ExperimentVariants.VariantB,
        });
        render(<FeefoWidget {...mocks} />);
        expect(screen.getByTestId('floating-widget-container')).toBeInTheDocument();
    });

    it('should call tracking function on widget click', () => {
        mockUseExperiment.mockReturnValue({
            testId: ExperimentTestIds.Ffo,
            testVariant: ExperimentVariants.VariantA,
        });
        render(<FeefoWidget {...mocks} />);

        const feefoWidget = screen.getByRole('link');
        fireEvent.click(feefoWidget);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(EventTypes.GenericEvent, {
            eventAction: EventActions.Interacted,
            eventCategory: EventCategories.FeefoWidget,
            eventLabel: 'Widget option 1 clicked',
            eventType: EventTypes.Interaction,
            eventValue: null,
        });
    });
});
