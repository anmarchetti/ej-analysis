import React from 'react';
import { render } from '@testing-library/react';

import FacilityItemFood from './FacilityItemFood';

const createStores = () => ({
    layoutStore: { isEditMode: true },
});

let mockStores = createStores();
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

const mockProps = {
    title: 'title',
    description: 'desciption',
};

describe('<FacilityItemFood />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it(`Should render`, () => {
        const { getByText } = render(<FacilityItemFood {...mockProps} />);
        expect(getByText('title')).toBeInTheDocument();
    });
});
