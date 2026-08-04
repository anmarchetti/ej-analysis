namespace easyJet.Holidays.Api.Domain.Validators
{
    /// <summary>
    /// Email replacer
    /// </summary>
    public class EmailReplacer : BaseReplacer
    {
        /// <inheritdoc/>
        public override string RegexPattern => @"\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*";
    }
}
