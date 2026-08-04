using System.ComponentModel.DataAnnotations;


namespace easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations
{
    /// <summary>
    /// Attribute to validate airport codes
    /// </summary>
    public class IataAttribute : RegularExpressionAttribute
    {
        private const string RegexPattern = "([A-Za-z]{3}|#[A-Za-z ]+)";

        /// <summary>
        /// Attribute to validate airport codes
        /// </summary>
        public IataAttribute() : base(RegexPattern)
        {
        }
    }
}
