using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.FlightExtraSearch;

public class FlightExtraSearchRequest : AtcomApiRequest<Internal.FlightExtraSearchRequest>
{
    public override HttpMethod Method => HttpMethod.Post;
    protected override string RequestNamespace => "AtComRes/FlightExtraSearchRequest";
}