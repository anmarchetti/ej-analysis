import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { useAxeReact } from './development.utils';

const mockAxe = jest.fn();
jest.mock('@axe-core/react', () => mockAxe);

describe('axe-react', () => {
    it('Should axe-react be invoked on non production env', async () => {
        renderHook(useAxeReact);

        await waitFor(() => {
            expect(mockAxe).toHaveBeenCalled();
        });
    });

    it('Should axe-react NOT be invoked on production env', async () => {
        (process.env as any).NODE_ENV = 'production';
        renderHook(useAxeReact);

        await waitFor(() => {
            expect(mockAxe).not.toHaveBeenCalled();
        });
    });
});
