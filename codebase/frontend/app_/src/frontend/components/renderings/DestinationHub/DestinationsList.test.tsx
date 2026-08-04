import React from 'react';
import * as observer from 'react-intersection-observer';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockIntersectionObserver } from 'frontend/__mocks__';
import { scrollToElement } from 'frontend/utils/ui.utils';
import * as alphabet from 'frontend/components/common/AlphabetIndex/alphabetIndex.utils';

import DestinationsList from './DestinationsList';

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

const createProps = () => ({
    fields: {
        items: [
            { Name: 'name', Id: '1' },
            { Name: 'name', Id: '2' },
        ],
    },
    Icon: 'icon',
});

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
});

let mockProps;
let mockStores = createStores();

mockIntersectionObserver();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/AlphabetIndex/AlphabetNav', () => ({ onAnchorClick }) => (
    <div data-tid='alphabet-nav'>
        <button onClick={() => onAnchorClick({ preventDefault: jest.fn() }, { id: 'id' })}>onAnchorClick</button>
    </div>
));

jest.mock('frontend/components/renderings/DestinationHub/components/DestinationCountry', () => () => (
    <div data-tid='destination-country' />
));

jest.mock('frontend/components/common/AlphabetIndex/AlphabetStickySelector', () => () => (
    <div data-tid='alphabet-sticky-selector' />
));

jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    InView: jest.fn(),
}));

describe('<DestinationsList />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        (observer.InView as jest.Mock).mockImplementation(() => [null, true]);
        jest.spyOn(alphabet, 'buildAlphabeticAnchors').mockImplementation(
            () => [{ letter: 'a' }, { letter: 'b' }] as any,
        );
    });

    it('should render AlphabetNav', () => {
        render(<DestinationsList {...mockProps} />);

        expect(screen.getByTestId('alphabet-nav')).toBeInTheDocument();
    });

    it('should render first letter from anchors', () => {
        const { getByText } = render(<DestinationsList {...mockProps} />);

        expect(getByText('a')).toBeInTheDocument();
    });

    it('should NOT render first letter when no anchors', () => {
        jest.spyOn(alphabet, 'buildAlphabeticAnchors').mockImplementation(() => []);
        const { queryByText } = render(<DestinationsList {...mockProps} />);

        expect(queryByText('a')).not.toBeInTheDocument();
    });

    it('should render list with 2 DestinationCountries', () => {
        const { getAllByTestId, getByRole } = render(<DestinationsList {...mockProps} />);

        expect(getByRole('list')).toBeInTheDocument();
        expect(getAllByTestId('destination-country').length).toBe(2);
    });

    it('should render list with 1 DestinationCountries if Name is Empty', () => {
        const props = {
            fields: {
                items: [
                    { Name: '', Id: '1' },
                    { Name: 'name', Id: '2' },
                ],
            },
        } as any;
        render(<DestinationsList {...props} />);

        expect(screen.getAllByTestId('destination-country').length).toBe(1);
    });

    it('should render AlphabetStickySelector', () => {
        const { getByTestId } = render(<DestinationsList {...mockProps} />);

        expect(getByTestId('alphabet-sticky-selector')).toBeInTheDocument();
    });

    it('should scrollToElement when onScrollToLetter is called', async () => {
        jest.spyOn(document, 'getElementById').mockReturnValue({ offsetTop: 100 } as HTMLElement);

        render(<DestinationsList {...mockProps} />);

        await userEvent.click(
            within(screen.getByTestId('alphabet-nav')).getByRole('button', {
                name: 'onAnchorClick',
            }),
        );

        expect(scrollToElement).toBeCalledWith({ offsetTop: 100 }, 15);
    });
});
