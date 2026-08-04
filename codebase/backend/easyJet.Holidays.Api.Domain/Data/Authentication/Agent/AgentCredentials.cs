using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Authentication.Agent
{
    /// <summary>
    /// Trade Agent model
    /// </summary>
    public class AgentCredentials
    {
        private string _number;
        private string _password;
        private string _ref;

        /// <summary>
        /// Agent number
        /// Regex matching only numbers and letters
        /// </summary>
        [Required]
        [StringLength(6, MinimumLength = 3)]
        [RegularExpression("^[A-Za-z0-9]+$")]
        [Display(Order = 1)]
        public string Number
        {
            get => _number;
            set => _number = value.ToUpper();
        }

        /// <summary>
        /// Password
        /// </summary>
        [Required]
        public string Password
        {
            get => _password;
            set => _password = value.ToUpper();
        }

        /// <summary>
        /// Agent ref
        /// </summary>
        [Required]
        [RegularExpression("^[\\w -]+$")]
        [Display(Order = 2)]
        public string Ref
        {
            get => _ref;
            set => _ref = value.ToUpper();
        }
    }
}