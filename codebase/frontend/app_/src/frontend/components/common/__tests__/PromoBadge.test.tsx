import { render } from '@testing-library/react';

import PromoBadge from 'frontend/components/common/PromoBadge';

const mockProps = {
    text: 'Text',
};

describe('<PromoBadge />', () => {
    it(`Should render`, () => {
        const { getByText } = render(<PromoBadge {...mockProps} />);
        expect(getByText('Text')).toBeInTheDocument();
    });
});
