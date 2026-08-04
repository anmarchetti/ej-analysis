import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

const mapping: Map<string, TradeUserRoles> = new Map(
    Object.values(TradeUserRoles).map(memberValue => [`${memberValue}`, memberValue] as const),
);

const getRole = (role: string): TradeUserRoles | undefined => mapping.get(role);

const roleHierarchy: { [key in TradeUserRoles]: number } = {
    [TradeUserRoles.SuperUser]: 4,
    [TradeUserRoles.Admin]: 3,
    [TradeUserRoles.Manager]: 2,
    [TradeUserRoles.Agent]: 1,
};

export const getUserRoleFromRolesArray = (roles: string[]): TradeUserRoles | undefined => {
    const tradeRoles = roles.map(role => getRole(role)).filter(role => role !== undefined);

    return tradeRoles.reduce(
        (highest, current) =>
            highest && current && roleHierarchy[highest] > roleHierarchy[current] ? highest : current,
        undefined,
    );
};
