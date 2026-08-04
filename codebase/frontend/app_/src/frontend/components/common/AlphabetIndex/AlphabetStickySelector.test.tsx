import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IAlphabetNavProps } from 'frontend/components/common/AlphabetIndex/AlphabetNav';
import AlphabetStickySelector from 'frontend/components/common/AlphabetIndex/AlphabetStickySelector';

jest.mock('frontend/components/common/AlphabetIndex/AlphabetNav', () => ({
    __esModule: true,
    default: props => <div data-tid='alphabet-nav' {...props} />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            getPhrase: jest.fn(),
        },
    }),
}));

describe('<AlphabetStickySelector />', () => {
    const resetMocks = () =>
        ({
            anchors: true,
            activeAnchor: true,
            className: 'class',
            onAnchorClick: jest.fn(),
        } as unknown as IAlphabetNavProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        const { container } = render(<AlphabetStickySelector {...mocks} />);

        expect(container.querySelector('.alphabet-sticky-selector')).toBeInTheDocument();
        expect(screen.queryByTestId('alphabet-nav')).not.toBeInTheDocument();
    });

    it('Should render AlphabetNav components after click', () => {
        const { container } = render(<AlphabetStickySelector {...mocks} />);

        const toggleButton = container.querySelector('.alphabet-sticky-selector__toggle');
        fireEvent.click(toggleButton!);

        expect(screen.getByTestId('alphabet-nav')).toBeInTheDocument();
    });
});
