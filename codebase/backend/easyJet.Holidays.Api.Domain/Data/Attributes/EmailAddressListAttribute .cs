using easyJet.Holidays.Api.Domain.Extensions;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public sealed class EmailAddressListAttribute : ValidationAttribute
    {
        private const string defaultError = "'{0}' contains an invalid email address.";

        public EmailAddressListAttribute()
            : base(defaultError) //
        {
        }

        public override bool IsValid(object value)
        {
            var emailAttribute = new EmailAddressAttribute();

            var list = value as IEnumerable<string>;

            if (list == null || list.IsNullOrEmpty())
            {
                ErrorMessage = "'{0}' is not a list of email addresses or is empty";
                return false;
            }

            if (list.GroupBy(x => x).Any(g => g.Count() > 1))
            {
                ErrorMessage = "'{0}' contains a duplicate email address.";
                return false;
            }

            return list.All(email => emailAttribute.IsValid(email));
        }

        public override string FormatErrorMessage(string name)
        {
            return String.Format(ErrorMessageString, name);
        }
    }
}