import React from 'react';
import { render } from '@testing-library/react';

import ImageWithFilter from './ImageWithFilter';

jest.mock('frontend/utils/getImage');

const resetMocks = () => ({
    imageSrc: 'img',
    dataTid: 'data-tid',
});

let mocks;

describe('<ImageWithFilter />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should render standard', () => {
        const { getByTestId } = render(<ImageWithFilter {...mocks} />);

        expect(getByTestId(mocks.dataTid)).toBeInTheDocument();
    });

    it('Should render svg with class when className prop is defined', () => {
        mocks.className = 'className';

        const { getByTestId } = render(<ImageWithFilter {...mocks} />);

        expect(getByTestId(mocks.dataTid)).toHaveClass(mocks.className);
    });

    it('Should NOT render when imageSrc is not defined', () => {
        mocks.imageSrc = undefined;

        const { container } = render(<ImageWithFilter {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });
});
