import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import AmendPaymentPriceDivider from './AmendPaymentPriceDivider';

import styles from './AmendPaymentPriceDivider.module.scss';

expect.extend(toHaveNoViolations);

describe('AmendPaymentPriceDivider', () => {
    it('renders and applies the correct class', () => {
        const { container } = render(<AmendPaymentPriceDivider />);
        expect(container.firstChild).toHaveClass(styles.divider);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentPriceDivider />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
