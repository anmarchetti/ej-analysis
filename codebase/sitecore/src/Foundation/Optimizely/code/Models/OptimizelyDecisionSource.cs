namespace easyJet.Foundation.Optimizely.Models
{
    /// <summary>
    /// Identifies where an Optimizely decision was triggered from within the Sitecore request flow.
    /// </summary>
    public enum OptimizelyDecisionSource
    {
        /// <summary>
        /// Generic/non-specific source (for example bulk Decide-for-keys usage).
        /// </summary>
        Default = 0,

        /// <summary>
        /// Decision came from Sitecore personalization rule conditions.
        /// </summary>
        ComponentPersonalization = 1,

        /// <summary>
        /// Decision came from rendering parameters (experiment gate on a component).
        /// </summary>
        ComponentParamFlag = 2
    }
}
