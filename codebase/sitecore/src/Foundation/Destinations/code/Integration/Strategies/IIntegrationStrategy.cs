namespace easyJet.Foundation.Destinations.Integration.Strategies
{
    public interface IIntegrationStrategy
    {
        /// <summary>
        /// Format name with abbreviation of the integration chanel type (HotelBeds, Atcom etc).
        /// </summary>
        /// <param name="pattern">Patten name.</param>
        /// <returns>Formatted name with abbreviation.</returns>
        string FormatNameWithAbbv(string pattern);

        /// <summary>
        /// Checks if atcom codes is matched with the integration strategy.
        /// </summary>
        /// <param name="atcomCode">Atcom code.</param>
        /// <param name="extractedMatch">Extracted match code.</param>
        /// <returns>True if atcom code is matched with the integration strategy.</returns>
        bool CheckIfCodeMatchStrategy(string atcomCode, out string extractedMatch);
    }
}
