import { render, screen } from '@testing-library/react';

import Mapper from './Mapper';

describe('Mapper', () => {
    it('should return empty element when no items', () => {
        const { container } = render(<Mapper items={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render items', () => {
        render(<Mapper items={['test1', 'test2']} />);

        expect(screen.getByText('test1')).toBeInTheDocument();
        expect(screen.getByText('test2')).toBeInTheDocument();
    });
});
