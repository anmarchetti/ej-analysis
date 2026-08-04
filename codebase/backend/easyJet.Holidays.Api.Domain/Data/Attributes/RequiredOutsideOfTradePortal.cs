using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes
{
    /// <summary>
    /// This attribute accesses <see cref="ITradeAgentAuthenticationService"/> to check whether a request 
    /// originates from the TradePortal or the B2C site. <br />
    /// If it was triggered by TradePortal, then the 
    /// attribute is not considered required as per <see cref="RequiredAttribute"/>
    /// </summary>
    public class RequiredOutsideOfTradePortal : RequiredAttribute
    {
        /// <summary>
        /// <inheritdoc /> <br />
        /// The context is mandatory as it is required for getting the <seealso cref="TradeAgentAuthenticationService"/> 
        /// </summary>
        /// <returns>true</returns>
        public override bool RequiresValidationContext => true;

        /// <summary>
        /// Validation which is skipped in case the requests originates from a Trade Agent.
        /// </summary>
        /// <param name="value"></param>
        /// <param name="validationContext"></param>
        /// <returns>
        ///     <see cref="ValidationResult.Success"/> in case that <seealso cref="ITradeAgentAuthenticationService.IsLoggedInAsTradeAgent"/> returns true <br /> 
        ///     otherwise: <see cref="ValidationAttribute.IsValid(object, ValidationContext)"/> 
        /// </returns>
        /// <exception cref="InvalidOperationException">if there is no <see cref="ITradeAgentAuthenticationService"/></exception>
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (!(validationContext.GetService(typeof(ITradeAgentAuthenticationService))
                is ITradeAgentAuthenticationService tradeAgentAuthService))
            {
                throw new InvalidOperationException($"no {nameof(ITradeAgentAuthenticationService)} available!");
            }

            if (tradeAgentAuthService.IsLoggedInAsTradeAgent())
            {
                return ValidationResult.Success;
            }

            return base.IsValid(value, validationContext);
        }
    }
}
