namespace easyJet.Feature.Redirects.Models
{
    public enum RedirectRuleStatus
    {
        // Default. Redirect uses the stored ToUrl without extra validation.
        Active = 0,

        // Resolves the target from the related item instead of using ToUrl directly.
        // A redirect is only applied when the related item is published at a URL
        // different from FromUrl and the current item is that related item.
        // Auto-created hotel rules start here; an activation job promotes them to
        // Active once the rename is published.
        AwaitingPublish = 1
    }
}
