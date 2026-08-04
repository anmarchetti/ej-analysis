import React from 'react';
import { render, screen } from '@testing-library/react';

import CharacterChangeWarning from 'frontend/components/renderings/AmendPassengers/components/CharacterChangeWarning/CharacterChangeWarning';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(v => v) },
    amendPassengerStore: {
        amendPassengerNameCharacterCount: 4,
    },
    tracking: {
        onShowExceedCharactersCountError: jest.fn(),
    },
});

const getProps = () => ({
    fields: {
        CharacterCountExceededWarning: { value: 'Exceeded by {count}' },
        CharacterCountWarning: { value: '{count} remaining' },
        CharacterCountExceededAdvice: { value: 'CharacterCountExceededAdvice {number}' },
        Phone: { value: '012345' },
    },
    remainingCharactersToChange: 3,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CharacterChangeWarning />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = getProps();
        mockStores = createStores();
    });

    it('Should render with remaining characters', () => {
        render(<CharacterChangeWarning {...mockProps} />);

        expect(screen.getByTestId('character-change-warning')).toBeInTheDocument();
        expect(screen.getByText('3 remaining')).toBeInTheDocument();
    });

    it('Should fire change characters exceed tracking event', () => {
        mockProps.remainingCharactersToChange = -1;
        render(<CharacterChangeWarning {...mockProps} />);

        expect(mockStores.tracking.onShowExceedCharactersCountError).toHaveBeenCalledWith('Exceeded by 1');
    });

    it('Should show characters count exceeded warning', () => {
        mockProps.remainingCharactersToChange = -2;
        render(<CharacterChangeWarning {...mockProps} />);

        expect(screen.getByText('Exceeded by 2')).toBeInTheDocument();
        expect(screen.getByText('CharacterCountExceededAdvice')).toBeInTheDocument();
        expect(screen.getByText('012345')).toBeInTheDocument();
        expect(screen.getByTestId('character-change-warning-tooltip')).toBeInTheDocument();
    });

    it('Should not show characters change exceeded for less than 3 characters', () => {
        mockProps.remainingCharactersToChange = 1;
        render(<CharacterChangeWarning {...mockProps} />);

        expect(screen.queryByText('1 remaining')).toBeInTheDocument();
        expect(screen.queryByText('Exceeded by 2')).not.toBeInTheDocument();
        expect(screen.queryByText('CharacterCountExceededAdvice')).not.toBeInTheDocument();
        expect(screen.queryByText('012345')).not.toBeInTheDocument();
    });
});
