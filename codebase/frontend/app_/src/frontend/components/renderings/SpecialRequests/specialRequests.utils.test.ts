import { getSelectedRequestsCodes, isSelectedRequestsDifferFromOriginal } from './specialRequests.utils';

describe('specialRequests.utils', () => {
    describe('getSelectedRequestsCodes()', () => {
        it('should return selected codes', () => {
            const res = getSelectedRequestsCodes([
                { groupCode: 'SRA', code: 'R1', name: 'Request 1', isSelected: false },
                { groupCode: 'SRA', code: 'R2', name: 'Request 2', isSelected: true },
                { groupCode: 'SRA', code: 'R3', name: 'Request 3' },
            ]);
            expect(res).toEqual(['R2']);
        });

        it('should return empty array if no requests', () => {
            const res = getSelectedRequestsCodes([]);
            expect(res).toEqual([]);
        });
    });

    describe('isSelectedRequestsDifferFromOriginal()', () => {
        it('should return false if selected codes are the same', () => {
            const res = isSelectedRequestsDifferFromOriginal(
                [
                    { groupCode: 'SRA', code: 'R1', name: 'Request 1', isSelected: true },
                    { groupCode: 'SRA', code: 'R2', name: 'Request 2', isSelected: false },
                ],
                [{ groupCode: 'SRA', code: 'R1', name: 'Request 1', displayName: 'Request 1' }],
            );
            expect(res).toBeFalsy();
        });

        it('should return true if selected codes are differ from original', () => {
            const res = isSelectedRequestsDifferFromOriginal(
                [{ groupCode: 'SRA', code: 'R1', name: 'Request 1', isSelected: false }],
                [{ groupCode: 'SRA', code: 'R1', name: 'Request 1', displayName: 'Request 1' }],
            );
            expect(res).toBeTruthy();
        });
    });
});
