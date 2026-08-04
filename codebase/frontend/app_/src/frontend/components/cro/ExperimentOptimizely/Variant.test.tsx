import React from 'react';
import { render, screen } from '@testing-library/react';

import { ExperimentVariants } from 'models/enum/cro/Experiment';

import Variant from './Variant';

describe('Variant component', () => {
    it('renders children when provided', () => {
        render(
            <Variant variant={ExperimentVariants.VariantA}>
                <div>Test Variant</div>
            </Variant>,
        );
        expect(screen.getByText('Test Variant')).toBeInTheDocument();
    });

    it('renders null when no children provided', () => {
        const { container } = render(<Variant variant={ExperimentVariants.VariantA} />);
        expect(container).toBeEmptyDOMElement();
    });
});
