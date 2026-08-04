import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TransferInstructions from './TransferInstructions';

const createProps = () => ({
    fields: {
        PopupTitle: { value: 'popup title' },
        PopupDescription: { value: 'popup description' },
        PopupArrivalInstructionTitle: { value: 'popup arrival instruction title' },
        PopupDepartureInstructionTitle: { value: 'popup departure instruction title' },
        CTA: { value: 'CTA' },
        Icon: { value: { src: 'icon' } },
    },
    departureInstruction: 'departureInstruction',
    arrivalInstruction: 'arrivalInstruction',
});
const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isTransferInstructionsEnabled: true, isBodyScrollLocked: jest.fn() },
    appStore: { isScreenMedium: true },
    routerStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TransferInstructions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        window.scrollTo = jest.fn();
    });

    it('should NOT render if fields NOT provided', () => {
        mockProps.fields = null;
        const { container } = render(<TransferInstructions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if Transfer Instructions Disabled', () => {
        mockStores.layoutStore.isTransferInstructionsEnabled = false;
        const { container } = render(<TransferInstructions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if departure and arrival instructions NOT provided', () => {
        mockProps.arrivalInstruction = null;
        mockProps.departureInstruction = null;
        const { container } = render(<TransferInstructions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render button when CTA provided', () => {
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('button')[0]).toHaveTextContent('CTA');
    });

    it('should render Drawer', () => {
        const { container } = render(<TransferInstructions {...mockProps} />);

        expect(container.getElementsByClassName('instructions-popup').length).toBe(1);
    });

    it('should render Popup after clicking button and screen is medium', async () => {
        const { getAllByRole, container } = render(<TransferInstructions {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        expect(container.getElementsByClassName('instructions-popup').length).toBe(2);
    });

    it('should render icon', () => {
        const { getByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getByRole('img')).toBeInTheDocument();
    });

    it('should render Title', () => {
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading')[0]).toHaveTextContent('popup title');
    });

    it('should NOT render title when title NOT provided', () => {
        mockProps.fields.PopupTitle.value = null;
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading')[0]).toHaveTextContent('popup arrival instruction title');
    });

    it('should render popup departure instruction title', () => {
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading')[2]).toHaveTextContent('popup departure instruction title');
    });

    it('should NOT render popup departure instruction title when popup departure instruction title NOT provided', () => {
        mockProps.fields.PopupDepartureInstructionTitle.value = null;
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading')[1]).toHaveTextContent('popup arrival instruction title');
    });

    it('should NOT render popup departure instruction title when departure instruction NOT provided', () => {
        mockProps.departureInstruction = null;
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading')[1]).toHaveTextContent('popup arrival instruction title');
    });

    it('should render popup arrival instruction title', () => {
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading')[1]).toHaveTextContent('popup arrival instruction title');
    });

    it('should NOT render popup arrival instruction title when popup arrival instruction title NOT provided', () => {
        mockProps.fields.PopupArrivalInstructionTitle.value = null;
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading').length).toBe(2);
    });

    it('should NOT render popup arrival instruction title when arrival instruction NOT provided', () => {
        mockProps.arrivalInstruction = null;
        const { getAllByRole } = render(<TransferInstructions {...mockProps} />);

        expect(getAllByRole('heading').length).toBe(2);
    });

    it('should render description', () => {
        const { getByText } = render(<TransferInstructions {...mockProps} />);

        expect(getByText('popup description')).toBeInTheDocument();
    });

    it('should NOT render description when description NOT provided', () => {
        mockProps.fields.PopupDescription = null;
        const { queryByText } = render(<TransferInstructions {...mockProps} />);

        expect(queryByText('popup description')).not.toBeInTheDocument();
    });

    it('should render departureInstruction', () => {
        const { getByText } = render(<TransferInstructions {...mockProps} />);

        expect(getByText('departureInstruction')).toBeInTheDocument();
    });

    it('should NOT render departureInstruction when departureInstruction NOT provided', () => {
        mockProps.departureInstruction = null;
        const { queryByText } = render(<TransferInstructions {...mockProps} />);

        expect(queryByText('departureInstruction')).not.toBeInTheDocument();
    });

    it('should render arrivalInstruction', () => {
        const { getByText } = render(<TransferInstructions {...mockProps} />);

        expect(getByText('arrivalInstruction')).toBeInTheDocument();
    });

    it('should NOT render arrivalInstruction when arrivalInstruction NOT provided', () => {
        mockProps.arrivalInstruction = null;
        const { queryByText } = render(<TransferInstructions {...mockProps} />);

        expect(queryByText('arrivalInstruction')).not.toBeInTheDocument();
    });

    it('should render 2 close buttons when screen is Medium', () => {
        const { container } = render(<TransferInstructions {...mockProps} />);

        expect(container.getElementsByClassName('instructions-popup__btn').length).toBe(2);
    });

    it('should render 1 close buttons when screen is NOT Medium', () => {
        mockStores.appStore.isScreenMedium = false;
        const { container } = render(<TransferInstructions {...mockProps} />);

        expect(container.getElementsByClassName('instructions-popup__btn').length).toBe(1);
    });
});
