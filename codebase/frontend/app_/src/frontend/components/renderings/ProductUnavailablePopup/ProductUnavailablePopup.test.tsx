import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { AmendmentType } from 'models/data/IBookingInfo';

import ProductUnavailablePopup from './ProductUnavailablePopup';

jest.mock('frontend/hooks/useMediaQuery');

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        NoOptionsTitle: mockSitecoreField('NoOptionsTitle'),
        Description: mockSitecoreField('Description'),
        NoOptionsDescription: mockSitecoreField('NoOptionsDescription'),
        SubDescription: mockSitecoreField('SubDescription'),
        Icon: { value: { src: 'Icon' } },
        CTA: mockSitecoreField('CTA'),
        NoOptionsCTA: mockSitecoreField('NoOptionsCTA'),
    },
    params: {},
    onClose: jest.fn(),
});

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ProductUnavailablePopup />', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
        });
        window.scrollTo = jest.fn();
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
    });

    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                isBodyScrollLocked: false,
                setIsBodyScrollLocked: jest.fn(),
            },
        });
        props = createProps();
    });

    it('Should render passed props', () => {
        render(<ProductUnavailablePopup {...props} />);

        expect(screen.getByText(props.fields.Title.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.Description.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.SubDescription.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.CTA.value)).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
    });

    it("Should not render Popup if product is provided and doesn't match params", () => {
        props.product = AmendmentType.Transfer;
        props.params.product = AmendmentType.Flight;

        const { container } = render(<ProductUnavailablePopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render Popup if product is provided and matches params', () => {
        props.product = AmendmentType.Flight;
        props.params.product = AmendmentType.Flight;

        const { container } = render(<ProductUnavailablePopup {...props} />);

        expect(container.querySelector('.popup')).toBeInTheDocument();
    });

    it('Should call onClose', async () => {
        render(<ProductUnavailablePopup {...props} />);
        const button = screen.getByText('CTA');
        await userEvent.click(button);

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('Should render Drawer on mobile', async () => {
        jest.mocked(useMoreThenMobileViewport).mockReturnValueOnce(false);

        const { container } = render(<ProductUnavailablePopup {...props} />);

        expect(container.querySelector('.drawer')).toBeTruthy();
        expect(screen.getByText(props.fields.Title.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.Description.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.SubDescription.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.CTA.value)).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
    });

    it('Should render NoOptions fields if areNoOptionsAvailable is true', () => {
        props.areNoOptionsAvailable = true;
        render(<ProductUnavailablePopup {...props} />);

        expect(screen.getByText(props.fields.NoOptionsTitle.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.NoOptionsDescription.value)).toBeInTheDocument();
        expect(screen.getByText(props.fields.NoOptionsCTA.value)).toBeInTheDocument();
    });
});
