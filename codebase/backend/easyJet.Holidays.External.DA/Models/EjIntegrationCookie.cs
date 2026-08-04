using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.External.B2B.Model
{
    public class EjIntegrationCookie
    {
        [Display(Order = 1)]
        public string Username { get; set; }

        [Display(Order = 2)]
        public string Password { get; set; }

        [Display(Order = 3)]
        public string IpAddress { get; set; }

        [Display(Order = 4)]
        public string Expires { get; set; }
    }
}
