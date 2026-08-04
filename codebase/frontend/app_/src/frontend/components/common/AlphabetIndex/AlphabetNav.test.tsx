import React from 'react';
import { render } from '@testing-library/react';

import AlphabetNav, { IAlphabetNavProps } from 'frontend/components/common/AlphabetIndex/AlphabetNav';

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
            anchors: [],
            activeAnchor: true,
            className: 'class',
            onAnchorClick: jest.fn(),
        } as unknown as IAlphabetNavProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        mocks.anchors = [
            { id: 'test1', letter: 'test1', items: [] },
            { id: 'test2', letter: 'test2', items: [] },
            { id: 'test3', letter: 'test3', items: [] },
        ];

        const { container } = render(<AlphabetNav {...mocks} />);

        // Check if the main component is rendered
        expect(container.querySelector('.alphabet-nav')).toBeInTheDocument();

        // Check if all letter elements are rendered
        const letterElements = container.querySelectorAll('.alphabet-nav__letter');
        expect(letterElements.length).toBe(3);
    });
});
