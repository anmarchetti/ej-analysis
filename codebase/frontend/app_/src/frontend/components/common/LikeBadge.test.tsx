import { render, screen } from '@testing-library/react';

import LikeBadge from 'frontend/components/common/LikeBadge';

const mockProps = {
    text: 'Text',
};

jest.mock('frontend/components/icons-new/RibbonLined', () => ({
    __esModule: true,
    default: () => <div>SvgRibbonLined</div>,
}));

describe('<LikeBadge />', () => {
    it(`Should render`, () => {
        const { container } = render(<LikeBadge {...mockProps} />);

        expect(screen.getByText(mockProps.text)).toBeInTheDocument();
        expect(container.querySelector('.like-badge')).toBeInTheDocument();
        expect(screen.getByText('SvgRibbonLined')).toBeInTheDocument();
    });

    it(`Should NOT render`, () => {
        mockProps.text = '';

        const { container } = render(<LikeBadge {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
