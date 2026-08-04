using System.Runtime.Serialization;

namespace easyJet.Foundation.Multisite.Models
{
    /// <summary>
    /// Promo pages cache busting response model.
    /// </summary>
    [DataContract]
    public class PromoCacheBustingResponse
    {
        public string QueryValue { get; set; }
    }
}