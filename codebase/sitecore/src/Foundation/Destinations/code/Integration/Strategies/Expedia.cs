namespace easyJet.Foundation.Destinations.Integration.Strategies
{
    public class Expedia : BaseIntegrationStrategy
    {
        /// <inheritdoc/>
        protected override string Abbv => "Expedia";

        /// <inheritdoc/>
        protected override string RegexPattern => @"^(?:W)(\d{7})$";
    }
}
