import * as React from 'react';
import { render, screen } from '@testing-library/react';

import useOptimizelyExperiment from 'frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment';
import { IExperimentConfig } from 'frontend/components/cro/ExperimentOptimizely/models';

import withOptimizelyExperiment from './withOptimizelyExperiment';

jest.mock('frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment');
const mockUseExperiment = useOptimizelyExperiment as jest.MockedFn<typeof useOptimizelyExperiment>;

const experimentConfigs: IExperimentConfig[] = [
    {
        experimentId: '25803030761',
        pagesId: '25808730036',
        variantA: '25812630033',
        originalVariant: '25750360760',
    },
];

const MockComponent = () => <div data-tid='mock-component'>MockComponent</div>;
const WrappedComponent = withOptimizelyExperiment(MockComponent, experimentConfigs);

describe('withOptimizelyExperiment HOC', () => {
    it('renders the wrapped component', () => {
        render(<WrappedComponent />);

        expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });

    it('calls useOptimizelyExperiment', () => {
        render(<WrappedComponent />);
        expect(mockUseExperiment).toHaveBeenCalled();
    });
});
