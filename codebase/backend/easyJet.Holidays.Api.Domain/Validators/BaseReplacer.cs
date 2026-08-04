using easyJet.Holidays.Api.Domain.Interfaces.Validators;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Validators
{
    /// <summary>
    /// BaseReplacer class
    /// </summary>
    public abstract class BaseReplacer : IReplace
    {
        private readonly char _replacingChar = '*';

        /// <summary>
        /// Regex pattern using in replacement
        /// </summary>
        public abstract string RegexPattern { get; }

        /// <inheritdoc/>
        public string MakeReplacing(string text)
        {
            return string.IsNullOrWhiteSpace(text) ? text : Regex.Replace(text, RegexPattern, ReplaceMatch).Trim();
        }

        /// <summary>
        /// Method returns a string consisting of specific chars. 
        /// The string length is equal to the length of original match value
        /// </summary>
        /// <param name="match"></param>
        /// <returns></returns>
        private string ReplaceMatch(Match match)
        {
            var result = new string(_replacingChar, match.Value.Length);
            return result;
        }
    }
}
