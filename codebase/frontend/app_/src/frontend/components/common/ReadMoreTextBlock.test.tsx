import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IOptions } from 'truncate-html';

import { ReadMoreTextBlock } from './ReadMoreTextBlock';

jest.mock('truncate-html', () => jest.fn((str, options) => `${str.substr(0, options.length)}...`));

const createProps = () => ({
    text: 'Full Test Text',
    truncateOptions: { length: 100 } as IOptions,
    className: 'test-class',
});
const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: { getPhrase: jest.fn() },
    routerStore: {},
});

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ReadMoreTextBlock />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should render full text', () => {
        const { container } = render(<ReadMoreTextBlock {...props} />);

        expect(container.firstChild).toHaveClass('test-class');
        expect(screen.getByText('Full Test Text')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('Should render truncated text', () => {
        props.truncateOptions.length = 4;
        render(<ReadMoreTextBlock {...props} />);

        expect(screen.getByText('Full...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('Should show full text after click on read more button', async () => {
        props.truncateOptions.length = 4;
        render(<ReadMoreTextBlock {...props} />);

        expect(screen.getByText('Full...')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByText('Full Test Text')).toBeInTheDocument();
    });

    it('Should render full text on desktop', () => {
        props.truncateOptions.length = 4;
        props.isActiveOnlyOnMobile = true;
        render(<ReadMoreTextBlock {...props} />);

        expect(screen.getByText('Full Test Text')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('Should render truncated text on mobile', () => {
        props.truncateOptions.length = 4;
        props.isActiveOnlyOnMobile = true;
        mockStores.appStore.isScreenLessMedium = true;
        render(<ReadMoreTextBlock {...props} />);

        expect(screen.getByText('Full...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
