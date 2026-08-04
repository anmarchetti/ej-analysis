export interface ITradePortalFeedback {
    append: (
        Documents: any,
        Name: string,
        TradeAgentName: string,
        ABTANumber: number,
        Email: string,
        FeedbackText: string,
        IsWebsiteRelated: boolean,
        IsTradeFeedback: boolean,
        IsOtherFeedback: boolean,
    ) => void;
}
