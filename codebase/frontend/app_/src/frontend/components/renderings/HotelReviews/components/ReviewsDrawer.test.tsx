import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { IReviewsData } from 'frontend/store/base';

import { ReviewsDrawer } from './ReviewsDrawer';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./ReviewsList', () => ({
    __esModule: true,
    default: () => <div />,
}));

describe('<ReviewsDrawer />', () => {
    const resetMocks = () => ({
        isExpanded: true,
        drawerRef: {} as React.RefObject<HTMLDivElement>,
        showLessMobileRef: {} as React.RefObject<HTMLDivElement>,
        onClose: jest.fn(),
        getPhrase: jest.fn(),
        reviewsData: {} as IReviewsData,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            layoutStore: {
                setIsBodyScrollLocked: jest.fn(),
                isBodyScrollLocked: false,
            },
        });
    });

    it('should close drawer on button click', async () => {
        render(<ReviewsDrawer {...mocks} />);

        await userEvent.click(screen.getByTestId('close-btn'));
        expect(mocks.onClose).toHaveBeenCalled();
    });
});
