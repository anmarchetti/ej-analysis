namespace easyJet.Holidays.Api.Domain.Validators
{
    /// <summary>
    /// Date replacer
    /// </summary>
    public class DateReplacer : BaseReplacer
    {
        /// <inheritdoc/>
        public override string RegexPattern => @"([0-2][0-9]|(3)[0-1])[-.\/](((0)[0-9])|((1)[0-2]))[-.\/]\d{4}";
    }
}
