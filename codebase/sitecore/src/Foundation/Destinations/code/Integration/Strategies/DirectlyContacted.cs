namespace easyJet.Foundation.Destinations.Integration.Strategies
{
    public class DirectlyContacted : BaseIntegrationStrategy
    {
        /// <inheritdoc/>
        protected override string Abbv => "DC";

        /// <inheritdoc/>
        protected override string RegexPattern => @"^(?![WXZ])(\w+)";
    }
}
