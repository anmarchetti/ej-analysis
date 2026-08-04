namespace easyJet.Foundation.Destinations.Integration.Strategies
{
    public class DynamicInventory : BaseIntegrationStrategy
    {
        /// <inheritdoc/>
        protected override string Abbv => "DI";

        /// <inheritdoc/>
        protected override string RegexPattern => @"^Z\w{7}$";
    }
}