import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';

export interface IAgentInfo {
    name: string;
    number: string;
    ref: string;
    role?: TradeUserRoles;
}
