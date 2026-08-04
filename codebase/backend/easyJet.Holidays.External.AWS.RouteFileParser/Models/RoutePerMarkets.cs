namespace easyJet.Holidays.External.AWS.RouteFileParser.Models
{
    public class RoutePerMarkets<T>
    {
        public List<string> Markets { get; set; }

        public T Routes { get; set; }
    }

}
