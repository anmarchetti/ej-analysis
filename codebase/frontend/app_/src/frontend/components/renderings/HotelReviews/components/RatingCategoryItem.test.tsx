import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { RatingCategoryItem } from './RatingCategoryItem';

describe('<RatingCategoryItem />', () => {
    const resetMocks = () => ({
        title: 'title',
        ratingNum: 3,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should be rendered', async () => {
        render(<RatingCategoryItem {...mocks} />);

        expect(await screen.findByText('title')).toBeVisible();
    });
});
