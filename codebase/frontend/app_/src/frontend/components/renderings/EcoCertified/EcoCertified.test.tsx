import * as React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { EcoCertified, IEcoCertifiedFields, TEcoCertifiedProps } from './EcoCertified';

const createStores = () => ({
    layoutStore: { isEcoCertifiedEnabledInFacilitiesTabs: true },
});

const resetMocks = () =>
    ({
        fields: {
            data: {
                Image: mockSitecoreField(mockSitecoreImageField('Image')),
                Title: mockSitecoreField('Title'),
                Description: mockSitecoreField('Description'),
                Link: mockSitecoreField({
                    href: 'linkHref',
                    text: 'linkText',
                }),
            },
        } as IEcoCertifiedFields,
        params: {} as any,
        rendering: {} as any,
    } as TEcoCertifiedProps);

let mockStores = createStores();
let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field, className }) => <div className={className}>JSSImage.{field.value.src}</div>,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, className }) => <div className={className}>RichTextWithLinks.{field.value}</div>,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className }) => <div className={className}>RouterLink.{children}</div>,
}));

describe('<EcoCertified />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mocks = resetMocks();
    });

    it('should NOT render when no fields', () => {
        delete mocks.fields;
        const { container } = render(<EcoCertified {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isEcoCertifiedEnabledInFacilitiesTabs is false', () => {
        mockStores.layoutStore.isEcoCertifiedEnabledInFacilitiesTabs = false;
        const { container } = render(<EcoCertified {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        const { container, getByText } = render(<EcoCertified {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(container.querySelector('.eco-certified')).toBeInTheDocument();
        expect(getByText(`JSSImage.${mocks.fields?.data.Image.value.src}`)).toHaveClass('eco-certified__img');
        expect(container.querySelector('.eco-certified__wrapper')).toBeInTheDocument();
        expect(getByText(mocks.fields?.data.Title.value || '')).toHaveClass('eco-certified__title');
        expect(container.querySelector('.eco-certified__description')).toBeInTheDocument();
        expect(getByText(`RichTextWithLinks.${mocks.fields?.data.Description.value}`)).toHaveClass(
            'eco-certified__text',
        );
        expect(getByText(`RouterLink.${mocks.fields?.data.Link.value.text}`)).toHaveClass('eco-certified__link');
    });

    it('should NOT render image when Image data field is not defined', () => {
        mocks.fields = { ...mocks.fields, data: { ...mocks.fields?.data, Image: null as any } } as IEcoCertifiedFields;
        const { container } = render(<EcoCertified {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(container.querySelector('.eco-certified')).toBeInTheDocument();
        expect(container.querySelector('.eco-certified__img')).not.toBeInTheDocument();
    });

    it('should NOT render title when Title data field is not defined', () => {
        mocks.fields = { ...mocks.fields, data: { ...mocks.fields?.data, Title: null as any } } as IEcoCertifiedFields;
        const { container } = render(<EcoCertified {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(container.querySelector('.eco-certified__wrapper')).toBeInTheDocument();
        expect(container.querySelector('.eco-certified__title')).not.toBeInTheDocument();
    });

    it('should NOT render description when Description data field is not defined', () => {
        mocks.fields = {
            ...mocks.fields,
            data: { ...mocks.fields?.data, Description: null as any },
        } as IEcoCertifiedFields;
        const { container } = render(<EcoCertified {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(container.querySelector('.eco-certified__description')).toBeInTheDocument();
        expect(container.querySelector('.eco-certified__text')).not.toBeInTheDocument();
    });

    it('should NOT render link when Link data field is not defined', () => {
        mocks.fields = { ...mocks.fields, data: { ...mocks.fields?.data, Link: null as any } } as IEcoCertifiedFields;
        const { container } = render(<EcoCertified {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(container.querySelector('.eco-certified__description')).toBeInTheDocument();
        expect(container.querySelector('.eco-certified__link')).not.toBeInTheDocument();
    });
});
