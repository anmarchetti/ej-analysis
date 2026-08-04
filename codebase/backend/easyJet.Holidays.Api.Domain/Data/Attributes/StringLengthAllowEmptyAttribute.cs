using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes
{
    /// <summary>
    /// Similar to DataAnnotations.StringLength attribute but allows empty strings
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public class StringLengthAllowEmptyAttribute : StringLengthAttribute
    {
        public StringLengthAllowEmptyAttribute(int maximumLength) : base(maximumLength)
        {
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (string.IsNullOrEmpty(value as string))
            {
                return ValidationResult.Success;
            }

            return base.IsValid(value, validationContext);
        }

        public override bool IsValid(object value)
        {
            if (string.IsNullOrEmpty(value as string))
            {
                return true;
            }

            return base.IsValid(value);
        }
    }
}
