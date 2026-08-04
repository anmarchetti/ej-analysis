import { render } from '@testing-library/react';

import { Spinner } from 'frontend/components/common/Spinner';

describe('<Spinner  />', () => {
    it(`Should render`, () => {
        const { getByTestId } = render(<Spinner />);
        expect(getByTestId('spinner-container')).toBeInTheDocument();
    });
});
