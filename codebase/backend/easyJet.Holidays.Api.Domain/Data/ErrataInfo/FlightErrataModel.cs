namespace easyJet.Holidays.Api.Domain.Data.ErrataInfo
{
    public class FlightErrataModel
    {
        public string Code { get; set; }
        public List<FlightErrataInfoModel> FlightErrataInfoModels { get; set; }
    }
}
