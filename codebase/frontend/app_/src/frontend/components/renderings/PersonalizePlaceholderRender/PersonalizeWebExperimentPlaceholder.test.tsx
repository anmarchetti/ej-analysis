import React from 'react';
import { render, screen } from '@testing-library/react';

import {
    PersonalizeWebExperimentPlaceholder,
    TPersonalizeWebExperimentPlaceholderProps,
} from './PersonalizeWebExperimentPlaceholder';

const createProps: (placeholderName?: string, height?: string) => TPersonalizeWebExperimentPlaceholderProps = (
    placeholderName?: string,
    height?: string,
) => ({
    rendering: {
        uid: 'test-uid',
        componentName: 'PersonalizeWebExperimentPlaceholder',
    },
    fields: {},
    params: {
        PlaceholderName: placeholderName || '',
        Height: height || '',
        Delay: '1000',
    },
});

describe('PersonalizeWebExperimentPlaceholder', () => {
    it('should render placeholder div with correct id', () => {
        const props = createProps('merch-banner');

        render(<PersonalizeWebExperimentPlaceholder {...props} />);

        expect(screen.getByTestId('personalize-web-experiment-placeholder')).toBeInTheDocument();
        expect(screen.getByTestId('merch-banner')).toBeInTheDocument();
    });

    it('should NOT render when PlaceholderName is empty', () => {
        const props = createProps('');
        const { container } = render(<PersonalizeWebExperimentPlaceholder {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when PlaceholderName is undefined', () => {
        const props = createProps();
        props.params.PlaceholderName = undefined as any;

        const { container } = render(<PersonalizeWebExperimentPlaceholder {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
