import { getUserRoleFromRolesArray } from 'frontend/utils/auth/tradeRoles.utils';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

describe('getUserRoleFromRolesArray', () => {
    it('should return undefined role when no roles are passed', () => {
        const result = getUserRoleFromRolesArray([]);
        expect(result).toBe(undefined);
    });

    it('should ignore undefined roles and return undefined User role', () => {
        const result = getUserRoleFromRolesArray(['nonexistent-role']);
        expect(result).toBe(undefined);
    });

    it('should return agent role if agent role is passed and no higher roles', () => {
        const result = getUserRoleFromRolesArray(['agent', 'nonexistent-role']);
        expect(result).toBe(TradeUserRoles.Agent);
    });

    it('should return correct role for single valid role', () => {
        const result = getUserRoleFromRolesArray(['admin']);
        expect(result).toBe(TradeUserRoles.Admin);
    });

    it('should return highest role from mixed roles array', () => {
        const roles = ['agent', 'admin', 'manager'];
        const result = getUserRoleFromRolesArray(roles);
        expect(result).toBe(TradeUserRoles.Admin);
    });

    it('should return correct highest role when same roles are repeated', () => {
        const roles = ['agent', 'manager', 'manager'];
        const result = getUserRoleFromRolesArray(roles);
        expect(result).toBe(TradeUserRoles.Manager);
    });

    test('should return SuperUser role when SuperUser role is passed passed', () => {
        const roles = ['agent', 'super-user', 'admin'];
        const result = getUserRoleFromRolesArray(roles);
        expect(result).toBe(TradeUserRoles.SuperUser);
    });
});
