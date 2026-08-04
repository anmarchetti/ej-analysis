using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback
{
    /// <summary>
    /// DTO for TradeAgentFeedback
    /// </summary>
    public class TradeAgentFeedbackRequest
    {
        /// <summary>
        /// Name of the feedback provider
        /// </summary>
        [StringLength(30)]
        [RegularExpression("^[a-zA-Z\\ \\-\\']+$")]
        [Required]
        public string Name { get; set; }

        /// <summary>
        /// Name of the travel agent / business
        /// </summary>
        [StringLength(30)]
        [RegularExpression("^[a-zA-Z\\ \\-\\']+$")]
        [Required]
        public string TradeAgentName { get; set; }

        /// <summary>
        /// the ABTA number
        /// </summary>
        [StringLength(15)]
        [RegularExpression("^[0-9 ]+$")]
        public string ABTANumber { get; set; }

        /// <summary>
        /// contact email
        /// </summary>
        [StringLength(256)]
        [ValidEmail]
        [Required]
        public string Email { get; set; }

        /// <summary>
        /// Whether the feedback is related to the website itself
        /// </summary>
        public bool IsWebsiteRelated { get; set; }
        /// <summary>
        /// Whether the feedback is trade specific
        /// </summary>
        public bool IsTradeFeedback { get; set; }
        /// <summary>
        /// for all kinds of feedback not related to either <see cref="IsWebsiteRelated"/> or <see cref="IsTradeFeedback"/>
        /// </summary>
        public bool IsOtherFeedback { get; set; }

        /// <summary>
        /// the actual feedback
        /// </summary>
        [StringLength(2500)]
        [RegularExpression("^[a-zA-Z0-9\\s,-.]*$")]
        public string FeedbackText { get; set; }

        /// <summary>
        /// A collection of files attached to the feedback
        /// </summary>
        [ValidTradeAgentFeedbackFiles]
        public IFormFileCollection Documents { get; set; }
    }
}
