import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import WhyBookWithUsCarouselItem from './WhyBookWithUsCarouselItem';

const createStores = () => ({
    layoutStore: { isEditMode: false },
    appStore: { isScreenMedium: true },
});

let mockStores = createStores();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<WhyBookWithUsCarouselItem>', () => {
    const resetMocks = () =>
        ({
            fields: {
                Icon: mockSitecoreField(mockSitecoreImageField('/')),
                Title: mockSitecoreField('Title'),
                Description: mockSitecoreField('Description'),
            },
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('Should render', () => {
        const { container } = render(<WhyBookWithUsCarouselItem {...mocks} />);
        expect(container.getElementsByClassName('carouselItem').length).toBe(1);
        expect(container.getElementsByClassName('icon')).toBeTruthy();
        expect(container.getElementsByClassName('title')).toBeTruthy();
    });

    it('Should NOT render RichTextWithLinks when the description is empty', () => {
        mocks.fields.Description = '';
        render(<WhyBookWithUsCarouselItem {...mocks} />);
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('Should NOT render RichTextWithLinks on Mobile screen', () => {
        mocks.isScreenMedium = false;
        render(<WhyBookWithUsCarouselItem {...mocks} />);
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('Should NOT render icon without src in default mode', () => {
        mocks.fields.Icon.value.src = '';
        mockStores.layoutStore.isEditMode = false;
        const { container } = render(<WhyBookWithUsCarouselItem {...mocks} />);
        expect(container.querySelector('.icon')).not.toBeInTheDocument();
    });

    it('Should NOT render item when empty fields', () => {
        delete mocks.fields;
        const { container } = render(<WhyBookWithUsCarouselItem {...mocks} />);
        expect(container.querySelector('.carouselItem')).not.toBeInTheDocument();
    });
});
