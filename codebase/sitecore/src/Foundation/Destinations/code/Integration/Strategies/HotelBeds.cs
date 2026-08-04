using System;
using System.Text.RegularExpressions;

namespace easyJet.Foundation.Destinations.Integration.Strategies
{
    public class HotelBeds : BaseIntegrationStrategy
    {
        /// <inheritdoc/>
        protected override string Abbv => "HBG";

        /// <inheritdoc/>
        protected override string RegexPattern => @"^(?:X)(\w{7})";

        public const string OldRegexPattern = @"^(?:X90*)(\w+)";

        public override bool CheckIfCodeMatchStrategy(string atcomCode, out string extractedMatch)
        {
            var match = Regex.Match(atcomCode, OldRegexPattern, RegexOptions.None, TimeSpan.FromSeconds(2));
            return match.Success
                ? CheckIfCodeMatchStrategy(atcomCode, out extractedMatch, OldRegexPattern)
                : CheckIfCodeMatchStrategy(atcomCode, out extractedMatch, RegexPattern);
        }
    }
}