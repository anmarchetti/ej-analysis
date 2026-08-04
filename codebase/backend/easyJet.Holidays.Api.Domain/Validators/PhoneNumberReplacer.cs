namespace easyJet.Holidays.Api.Domain.Validators
{
    /// <summary>
    /// PhoneNumber replacer
    /// </summary>
    public class PhoneNumberReplacer : BaseReplacer
    {
        /// <inheritdoc/>
        public override string RegexPattern => @"\(?\+?\(?\-?[0-9][0-9()\-\s\.+]{5,20}[0-9]";
    }
}
