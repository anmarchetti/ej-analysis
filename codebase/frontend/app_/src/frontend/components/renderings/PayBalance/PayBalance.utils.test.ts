import { scrollToPayBlock } from 'frontend/components/renderings/PayBalance/PayBalance.utils';

describe('PayBalance Utils', () => {
    it('should scroll to pay block', () => {
        // Arrange
        const mockScrollIntoView = jest.fn();

        jest.spyOn(document, 'querySelector').mockReturnValue({
            scrollIntoView: mockScrollIntoView,
        } as unknown as Element);

        // Act
        scrollToPayBlock();

        // Assert
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
});
