using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Data.ContactUs;

public class ContactFormValidateNameAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        var input = (string)value;
        var regex = new Regex(@"^[^0-9+=*/\\@#%^&_~|<>{}\[\]\()\$€£¥¢₩±×÷∑√№∞…;:""“”,.?!—]{1,100}$");

        return regex.IsMatch(input) ? ValidationResult.Success : new ValidationResult(ErrorMessage);
    }
}