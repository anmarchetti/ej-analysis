import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import CabinBagsValidationPopup, { TCabinBagsValidationPopupProps } from './CabinBagsValidationPopup';

const createProps = (): TCabinBagsValidationPopupProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        CTA: mockSitecoreField('CTA'),
    },
    params: {},
    rendering: {},
});

const createStores = () => ({
    bookingStore: {
        extraLuggage: { setLCBFullPopupShown: jest.fn(), isLCBFullPopupShown: true },
    },
});

let mockProps = createProps();
let mockStores = createStores();

const mockRichTextWithLinksComponent = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksComponent(props);

        return <div data-tid='richtext-with-links'>{props.field.value}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CabinBagsValidationPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render default when isLCBFullPopupShown = true', () => {
        render(<CabinBagsValidationPopup {...mockProps} />);

        expect(mockRichTextWithLinksComponent).toHaveBeenCalledWith({
            tag: 'p',
            field: mockProps.fields!.Description,
            className: 'description',
            dataId: 'cabin-bags-validation-popup--subtitle',
        });
        expect(screen.getByTestId('richtext-with-links')).toHaveTextContent('Description');
        expect(screen.getByTestId('cabin-bags-validation-popup')).toBeInTheDocument();
        expect(screen.getByTestId('cabin-bags-validation-popup--title')).toHaveTextContent('Title');
        expect(screen.getByTestId('cabin-bags-validation-popup--button')).toHaveTextContent('CTA');
    });

    it('should skip render when no fields', () => {
        delete mockProps.fields;

        render(<CabinBagsValidationPopup {...mockProps} />);

        expect(screen.queryByTestId('cabin-bags-validation-popup')).not.toBeInTheDocument();
    });

    it('should NOT render default when isLCBFullPopupShown is false', () => {
        mockStores.bookingStore.extraLuggage.isLCBFullPopupShown = false;

        render(<CabinBagsValidationPopup {...mockProps} />);

        expect(screen.queryByTestId('cabin-bags-validation-popup')).not.toBeInTheDocument();
    });

    it('should call correct functions on button click', async () => {
        render(<CabinBagsValidationPopup {...mockProps} />);

        const button = screen.getByTestId('cabin-bags-validation-popup--button');

        await userEvent.click(button);

        expect(mockStores.bookingStore.extraLuggage.setLCBFullPopupShown).toHaveBeenCalledWith(false);
    });
});
