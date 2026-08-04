namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    public class SpecialRequest
    {
        public string DisplayName { get; set; }
        public bool PreSelectedForInfant { get; set; }
        public string PreSelectedForAlert { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public object Type { get; set; }
        public string GroupCode { get; set; }
    }

    public class SpecialRequestsGroup
    {
        public List<SpecialRequest> SpecialRequests { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public object Type { get; set; }
    }

    public class SpecialRequests
    {
        public List<SpecialRequestsGroup> SpecialRequestType { get; set; }

        public List<SpecialRequestsGroup> SpecialRequestsContradictoryGroup { get; set; }
    }
}
