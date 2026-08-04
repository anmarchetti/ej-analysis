using easyJet.Holidays.Api.Domain.Constants;

namespace easyJet.Holidays.Api.Domain.Data.ErrataInfo
{
    public class HotelErrataModel
    {
        public string HotelCode { get; set; }
        public List<ErrataInfoModel> ErratasInfo { get; set; }
    }
    public class ErrataInfoModel
    {
        public string Errata { get; set; }
        public ErrataTypes ErrataCode { get; set; }

        //Errata relevant dates
        /// <summary>
        /// When errata takes effect
        /// </summary>
        public DateTime EffectiveDate { get; set; }

        /// <summary>
        /// Start date when actual trip starts
        /// </summary>
        public DateTime DepartureStartDate { get; set; }

        /// <summary>
        /// End date when actual trip starts
        /// </summary>
        public DateTime DepartureEndDate { get; set; }

        /// <summary>
        /// Start date of the booking creation
        /// </summary>
        public DateTime BookStartDate { get; set; }

        /// <summary>
        /// End date of the booking creation
        /// </summary>
        public DateTime BookEndDate { get; set; }

        /// <summary>
        /// Errata's language
        /// </summary>
        public string LanguageCode { get; set; } = Language.EnglishCode;
    }

    public class AtcomErrataModel : ErrataInfoModel
    {
        public string Code { get; set; }
    }

    public enum ErrataTypes
    {
        Accommodation,
        Geography
    }
}
