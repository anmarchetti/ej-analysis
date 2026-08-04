namespace easyJet.Holidays.Api.Domain.Interfaces.Validators
{
    /// <summary>
    /// IReplace interface 
    /// </summary>
    public interface IReplace
    {
        /// <summary>
        /// Method represents replacing action using particular regex pattern 
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        string MakeReplacing(string text);
    }
}
