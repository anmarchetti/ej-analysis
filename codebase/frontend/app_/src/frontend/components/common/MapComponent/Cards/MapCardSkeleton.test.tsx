import { render } from '@testing-library/react';

import MapCardSkeleton from './MapCardSkeleton';

describe('<MapCardSkeleton />', () => {
    it('should render', () => {
        const { container } = render(<MapCardSkeleton onClose={jest.fn()} />);

        expect(container.querySelector('.skeleton')).toBeInTheDocument();
        expect(container.querySelectorAll('.line')).toHaveLength(4);
    });
});
