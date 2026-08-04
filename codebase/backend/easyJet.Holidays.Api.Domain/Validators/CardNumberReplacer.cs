namespace easyJet.Holidays.Api.Domain.Validators
{
    /// <summary>
    /// CardNumber replacer
    /// </summary>
    public class CardNumberReplacer : BaseReplacer
    {
        /// <inheritdoc/>
        public override string RegexPattern => @"(?:[0-9][ -]*?){13,20}";
    }
}
