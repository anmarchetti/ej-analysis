import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';

import CompoundSlider from './CompoundSlider';

const mockSlider = jest.fn();
jest.mock('react-compound-slider', () => ({
    __esModule: true,
    Handles: ({ children }) => (
        <div data-tid='handles'>{children({ handles: [{ percent: 10, id: 'id' }], getHandleProps: jest.fn() })}</div>
    ),
    Rail: ({ children }) => <div data-tid='rail'>{children({ getRailProps: jest.fn() })}</div>,
    Slider: ({ children, onChange, onUpdate, ...props }) => {
        mockSlider(props);

        return (
            <div data-tid='slider'>
                {children}
                <button data-tid='slider-on-change' onClick={() => onChange([NaN, 15])} onKeyDown={jest.fn()} />
                <button data-tid='slider-on-update' onClick={() => onUpdate([NaN, 15])} onKeyDown={jest.fn()} />
            </div>
        );
    },
    Ticks: ({ children }) => <div data-tid='ticks'>{children({ ticks: [{ id: '2' }] })}</div>,
    Tracks: ({ children }) => (
        <div data-tid='tracks'>
            {children({ tracks: [{ id: '1', source: 'source1', target: { percent: 20 } }], getTrackProps: jest.fn() })}
        </div>
    ),
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CompoundSlider/>', () => {
    const resetMocks = () =>
        ({
            getPhrase: jest.fn(),
            min: 10,
            max: 20,
            values: [11, 15],
            ruler: 1,
            onSlide: jest.fn(),
            onSliding: jest.fn(),
        } as any);

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    describe('Rendering', () => {
        it('should render slider', () => {
            render(<CompoundSlider {...mocks} />);

            expect(screen.getByTestId('slider')).toBeInTheDocument();
        });

        it('should not render ticks when ruler is 0', () => {
            mocks.ruler = 0;

            render(<CompoundSlider {...mocks} />);

            expect(screen.queryByTestId('ticks')).not.toBeInTheDocument();
        });

        it('should render all children', () => {
            mocks.ruler = [1, 1];

            render(<CompoundSlider {...mocks} />);

            expect(screen.getByTestId('handles')).toBeInTheDocument();
            expect(screen.getByTestId('compound-slider-handle')).toBeInTheDocument();
            expect(screen.getByTestId('compound-slider-handle-value')).toBeInTheDocument();
            expect(screen.getByTestId('rail')).toBeInTheDocument();
            expect(screen.getByTestId('ticks')).toBeInTheDocument();
            expect(screen.getByTestId('compound-slider-track')).toBeInTheDocument();
            expect(screen.getByTestId('tracks')).toBeInTheDocument();
            expect(screen.getByTestId('compound-slider-tick')).toBeInTheDocument();
        });

        it('should render slider with correct values', () => {
            mocks.ruler = 'test';
            mocks.min = 9;
            mocks.max = 10;
            mocks.values = [7, 11];

            render(<CompoundSlider {...mocks} />);

            expect(mockSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: [mocks.min, mocks.max],
                }),
            );
        });

        it('should call onSlide with correct values', async () => {
            render(<CompoundSlider {...mocks} />);

            const button = screen.getByTestId('slider-on-change');
            await userEvent.click(button);

            expect(mocks.onSlide).toHaveBeenCalledWith([null, 15]);
        });

        it('should call onSliding with correct values', async () => {
            render(<CompoundSlider {...mocks} />);

            const button = screen.getByTestId('slider-on-update');
            await userEvent.click(button);

            expect(mocks.onSliding).toHaveBeenCalledWith([null, 15]);
        });

        it('should render disabled slider', () => {
            mocks.ruler = [1, 1];
            mocks.isDisabled = true;

            render(<CompoundSlider {...mocks} />);

            expect(screen.getByTestId('compound-slider-handle')).toHaveClass(
                'compound-slider__handle-ball compound-slider-disable',
            );
            expect(screen.queryByTestId('compound-slider-handle-value')).not.toBeInTheDocument();
            expect(screen.getByTestId('compound-slider-track')).toHaveClass(
                'compound-slider__track compound-slider-disable',
            );
        });
    });
});
