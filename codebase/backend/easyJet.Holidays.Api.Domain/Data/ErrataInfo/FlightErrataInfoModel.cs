using easyJet.Holidays.Api.Domain.Constants;

namespace easyJet.Holidays.Api.Domain.Data.ErrataInfo
{
    public class FlightErrataInfoModel
    {
        public string Text { get; set; }

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
        /// Days of week which the information applies
        /// </summary>
        public DepartDays DepartDays { get; set; }

        /// <summary>
        /// Internal, External Flights
        /// </summary>
        public InventoryType InventoryType { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        /// <summary>
        /// Errata's language
        /// </summary>
        public string LanguageCode { get; set; } = Language.EnglishCode;
    }

    public class AtcomFlightErrataInfoModel : FlightErrataInfoModel
    {
        public string Code { get; set; }
        public string DeparturePoint { get; set; }
        public Type DeparturePointType { get; set; }
        public string ArrivalPoint { get; set; }
        public Type ArrivalPointType { get; set; }

        public void Copy(AtcomFlightErrataInfoModel atcomFlightErrataInfoModel)
        {
            atcomFlightErrataInfoModel.ArrivalPointType = this.ArrivalPointType;
            atcomFlightErrataInfoModel.ArrivalPoint = this.ArrivalPoint;
            atcomFlightErrataInfoModel.Code = this.Code;
            atcomFlightErrataInfoModel.DeparturePoint = this.DeparturePoint;
            atcomFlightErrataInfoModel.DeparturePointType = this.DeparturePointType;
            atcomFlightErrataInfoModel.DepartDays = this.DepartDays;
            atcomFlightErrataInfoModel.BookEndDate = this.BookEndDate;
            atcomFlightErrataInfoModel.BookStartDate = this.BookStartDate;
            atcomFlightErrataInfoModel.DepartureStartDate = this.DepartureStartDate;
            atcomFlightErrataInfoModel.DepartureEndDate = this.DepartureEndDate;
            atcomFlightErrataInfoModel.EffectiveDate = this.EffectiveDate;
            atcomFlightErrataInfoModel.Text = this.Text;
            atcomFlightErrataInfoModel.LanguageCode = this.LanguageCode;
            atcomFlightErrataInfoModel.InventoryType = this.InventoryType;
            atcomFlightErrataInfoModel.StartDate = this.StartDate;
            atcomFlightErrataInfoModel.EndDate = this.EndDate;
        }
    }

    public enum Type
    {
        None,
        Airport,
        Area,
        Country
    }

    public enum InventoryType
    {
        AllInventory = 0,
        Internal = 1,
        External = 2,
    }

    [Flags]
    public enum DepartDays
    {
        None = 0,
        Sunday = 1,
        Monday = 2,
        Tuestday = 4,
        Wednesday = 8,
        Thursday = 16,
        Friday = 32,
        Saturday = 64,
    }
}
