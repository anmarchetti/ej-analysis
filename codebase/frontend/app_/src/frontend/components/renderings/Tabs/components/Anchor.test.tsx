import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { generateAnchorMocksArray } from 'frontend/components/renderings/Tabs/__mocks__/createAnchors';

import Anchor, { TAnchorProps } from './Anchor';

const [anchorLinks] = generateAnchorMocksArray(1);

const createProps = (): TAnchorProps => ({
    fields: anchorLinks.fields,
    isActive: false,
    reviews: 4,
    onClick: jest.fn(),
});

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<Anchor />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should render active tab', () => {
        props.isActive = true;

        render(<Anchor {...props} />);

        expect(screen.getByRole('link')).toHaveClass('anchor--active');
    });

    it('should render not active tab', () => {
        render(<Anchor {...props} />);

        expect(screen.getByRole('link')).not.toHaveClass('anchor--active');
    });

    it('should call onClick()', async () => {
        render(<Anchor {...props} />);

        await userEvent.click(screen.getByRole('link'));

        expect(props.onClick).toHaveBeenCalled();
    });

    it('should have d-none class when labels is tokenazible but there is no reviews', () => {
        props.fields.Title = mockSitecoreField(`${Tokens.Review}`);
        props.reviews = 0;

        render(<Anchor {...props} />);

        expect(screen.getByRole('link')).toHaveClass('d-none');
    });
});
