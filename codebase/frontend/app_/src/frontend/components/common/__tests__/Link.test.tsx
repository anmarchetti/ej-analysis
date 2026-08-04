import { render } from '@testing-library/react';

import useBasePath from 'frontend/hooks/useBasePath';
import Link from 'frontend/components/common/Link';

jest.mock('frontend/hooks/useBasePath', () => jest.fn().mockReturnValue('/en/holidays'));
const mockUseBasePath = useBasePath as jest.MockedFunction<typeof useBasePath>;

describe('<Link />', () => {
    it(`Should render http link`, () => {
        const { getByRole } = render(<Link href='http://localhost:3000'>Text</Link>);

        expect(getByRole('link')).toHaveAttribute('href', 'http://localhost:3000');
    });

    it(`Should render link with basePath`, () => {
        const { getByRole } = render(<Link href='/test'>Text</Link>);

        expect(mockUseBasePath).toBeCalledWith(undefined);
        expect(getByRole('link')).toHaveAttribute('href', '/en/holidays/test');
    });

    it(`Should render link with basePath and change locale`, () => {
        mockUseBasePath.mockReturnValueOnce('/ch-fr/vacances');
        const { getByRole } = render(
            <Link href='/test' locale='ch-fr'>
                Text
            </Link>,
        );

        expect(mockUseBasePath).toBeCalledWith('ch-fr');
        expect(getByRole('link')).toHaveAttribute('href', '/ch-fr/vacances/test');
    });
});
