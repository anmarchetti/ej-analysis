import { render } from '@testing-library/react';

import PhonePrefix from 'frontend/components/common/PhonePrefix';

const mockProps = {
    code: 'Text',
};

describe('<PhonePrefix />', () => {
    it(`Should render`, () => {
        const { getByText } = render(<PhonePrefix {...mockProps} />);
        expect(getByText('Text')).toBeInTheDocument();
    });
});
