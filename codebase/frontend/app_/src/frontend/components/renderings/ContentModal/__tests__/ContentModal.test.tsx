import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ContentModal from 'frontend/components/renderings/ContentModal/ContentModal';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});
const createProps = () => ({
    fields: {
        ModalTitle: mockSitecoreField('Title'),
        ModalDescription: mockSitecoreField('Description'),
        ModalButtonText: mockSitecoreField('Button'),
    },
    params: { IsOutlined: false },
    rendering: {} as any,
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);
global.scrollTo = jest.fn();

describe('<ContentModal />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it(`Popup default as closed`, () => {
        const { queryByText } = render(<ContentModal {...mockProps} />);
        expect(queryByText(mockProps.fields.ModalTitle.value)).not.toBeInTheDocument();
    });

    it(`Toggle Popup`, async () => {
        const { getByText, queryByText } = render(<ContentModal {...mockProps} />);

        await userEvent.click(getByText(mockProps.fields.ModalButtonText.value));
        expect(getByText(mockProps.fields.ModalTitle.value)).toBeInTheDocument();

        await userEvent.click(getByText(SitecoreDictionary.GlobalsButtonsClose));
        expect(queryByText(mockProps.fields.ModalTitle.value)).not.toBeInTheDocument();
    });
});
