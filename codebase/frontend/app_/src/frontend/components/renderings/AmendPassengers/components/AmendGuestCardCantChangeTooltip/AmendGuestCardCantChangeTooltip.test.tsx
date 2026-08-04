import React from 'react';
import { render } from '@testing-library/react';

import AmendGuestCardCantChangeTooltip from './AmendGuestCardCantChangeTooltip';

const getProps = () => ({
    text: { value: 'Tooltip text' },
});

let mockProps;

jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ content }) => <div>{content}</div>,
}));

describe('<AmendGuestCardCantChangeTooltip />', () => {
    beforeEach(() => {
        mockProps = getProps();
    });

    it('Should render passed props', () => {
        const { getByText } = render(<AmendGuestCardCantChangeTooltip {...mockProps} />);

        expect(getByText('Tooltip text')).toBeInTheDocument();
    });

    it('Should render nothing', () => {
        mockProps.text = undefined;
        const { container } = render(<AmendGuestCardCantChangeTooltip {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });
});
