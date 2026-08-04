using easyJet.Holidays.Api.Domain.Interfaces.Validators;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// String extensions
    /// </summary>
    public static class StringExtensions
    {
        /// <summary>
        /// Validate input text using replacers in turn
        /// </summary>
        /// <param name="text"></param>
        /// <param name="replacers"></param>
        /// <returns></returns>
        public static string Validate(this string text, List<IReplace> replacers)
        {
            if (string.IsNullOrWhiteSpace(text) || replacers == null)
            {
                return text;
            }

            var result = text;
            foreach (var replacer in replacers)
            {
                result = replacer.MakeReplacing(result);
            }

            return result;
        }

        /// <summary>
        /// Serialize object to JSON string
        /// </summary>
        public static string ToJsonString(this object obj)
        {
            return JsonConvert.SerializeObject(obj);
        }
        
        /// <summary>
        /// Remove a postfix from a string, only if it has the given postfix
        /// </summary>
        public static string RemovePostfix(this string text, string postfix)
        {
            if (string.IsNullOrWhiteSpace(text) || postfix == null)
            {
                return text;
            }
            
            if (text.EndsWith(postfix, StringComparison.InvariantCulture)) {
                return text.Substring(0, text.Length - postfix.Length);
            }
            
            return text;
        }
    }
}
