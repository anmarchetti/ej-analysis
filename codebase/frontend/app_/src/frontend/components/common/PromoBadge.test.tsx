import { render, screen } from '@testing-library/react';

import PromoBadge from 'frontend/components/common/PromoBadge';

const mockProps = {
    text: 'Text',
};

jest.mock('frontend/components/icons-new/Promo', () => ({
    __esModule: true,
    default: () => <div>SvgPromo</div>,
}));

jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    RichText: ({ field, tag }: { field: { value: string }; tag: string }) => {
        const Tag = tag as keyof JSX.IntrinsicElements;

        return <Tag>{field.value}</Tag>;
    },
}));

describe('<PromoBadge />', () => {
    it(`should render`, () => {
        const { container } = render(<PromoBadge {...mockProps} />);

        expect(screen.getByText(mockProps.text)).toBeInTheDocument();
        expect(container.querySelector('.like-badge')).toBeInTheDocument();
        expect(screen.getByText('SvgPromo')).toBeInTheDocument();
    });

    it(`should NOT render when text is empty`, () => {
        const { container } = render(<PromoBadge text='' />);

        expect(container).toBeEmptyDOMElement();
    });

    it(`should NOT render when text is undefined`, () => {
        const { container } = render(<PromoBadge text={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });
});
