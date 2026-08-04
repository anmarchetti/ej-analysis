import * as React from 'react';
import { render } from '@testing-library/react';

import IntroBlock from './IntroBlock';

jest.mock('frontend/components/renderings/TextBlock', () => ({
    __esModule: true,
    default: () => <div>TextBlock</div>,
}));

const resetMocks = () => ({
    fields: {
        IntroTitle: {
            value: 'IntroTitle',
        },
        IntroDescription: { value: 'IntroDescription' },
    },
    rendering: {} as any,
    params: {} as any,
});

let mocks;

describe('<IntroBlock />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when no fields', () => {
        delete mocks.fields;
        const { container } = render(<IntroBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render discount pill if discount not received', () => {
        const { queryByText } = render(<IntroBlock {...mocks} />);

        expect(queryByText('TextBlock')).toBeInTheDocument();
    });
});
