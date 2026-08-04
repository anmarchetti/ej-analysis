import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { RatingBarItem } from './RatingBarItem';

describe('<RatingBarItem />', () => {
    const resetMocks = () => ({
        mark: 'mark',
        percentage_value: 70,
    });

    const mocks = resetMocks();

    it('should standart render', async () => {
        render(<RatingBarItem {...mocks} />);
        expect(await screen.findByText('mark')).toBeVisible();
        expect(await screen.findByText('70%')).toBeVisible();
    });
});
