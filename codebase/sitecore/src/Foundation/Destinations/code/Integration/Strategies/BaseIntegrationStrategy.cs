using System;
using System.Text.RegularExpressions;

namespace easyJet.Foundation.Destinations.Integration.Strategies
{
    public abstract class BaseIntegrationStrategy : IIntegrationStrategy
    {
        /// <summary>
        /// Gets abbreviation of integration chanel ex (HotelBeds, Directly Contracted, Dynamic Inventory, etc.).
        /// </summary>
        protected abstract string Abbv { get; }

        /// <summary>
        /// Gets regex pattern that matches integration code.
        /// Like hotels start with 'X' or 'X9' - means that it's HotelBeds integration code.
        /// older hbg codes with less than 7 digits will start with 'X9' - newer codes with 7 digits will start with only 'X'
        /// </summary>
        protected abstract string RegexPattern { get; }

        /// <inheritdoc/>
        public virtual string FormatNameWithAbbv(string pattern)
        {
            return string.Format(pattern, Abbv);
        }

        /// <inheritdoc/>
        public virtual bool CheckIfCodeMatchStrategy(string atcomCode, out string extractedMatch)
        {
            return CheckIfCodeMatchStrategy(atcomCode, out extractedMatch, RegexPattern);
        }

        protected virtual bool CheckIfCodeMatchStrategy(string atcomCode, out string extractedMatch, string regexPattern)
        {
            var match = Regex.Match(atcomCode, regexPattern, RegexOptions.None, TimeSpan.FromSeconds(2));
            extractedMatch = null;
            if (!match.Success)
            {
                return false;
            }

            extractedMatch = match.Groups.Count > 1 ? match.Groups[1].Value : match.Groups[0].Value;
            return true;
        }
    }
}
