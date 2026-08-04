import React from 'react';
import { render, screen } from '@testing-library/react';

import { NotFoundFlipText } from './NotFoundFlipText';

const createStores = () => ({
    appStore: {
        isScreenExtraSmall: false,
        isScreenLarge: false,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<NotFoundFlipText />', () => {
    const text = 'SORRY, WE COULDN‘T FIND YOUR PAGE';

    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should render 2 lines on desktop', () => {
        mockStores.appStore.isScreenLarge = true;
        const { container } = render(<NotFoundFlipText text={text} />);

        expect(screen.getByRole('heading')).toHaveTextContent(text);
        expect(container.getElementsByClassName('flip-card-line')).toHaveLength(2);
    });

    it('Should render 4 lines on tablet', () => {
        const { container } = render(<NotFoundFlipText text={text} />);

        expect(container.getElementsByClassName('flip-card-line')).toHaveLength(4);
    });

    it('Should render 6 lines on mobile', () => {
        mockStores.appStore.isScreenExtraSmall = true;
        const { container } = render(<NotFoundFlipText text={text} />);

        expect(container.getElementsByClassName('flip-card-line')).toHaveLength(6);
    });
});
