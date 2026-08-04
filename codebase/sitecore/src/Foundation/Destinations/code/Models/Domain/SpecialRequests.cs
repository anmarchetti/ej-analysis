using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class SpecialRequests
    {
        public List<SpecialRequestType> SpecialRequestType { get; set; }

        public List<SpecialRequestsContradictoryGroup> SpecialRequestsContradictoryGroup { get; set; }
    }
}