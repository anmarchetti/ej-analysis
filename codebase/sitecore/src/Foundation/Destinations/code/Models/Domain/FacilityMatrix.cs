namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityMatrix
    {
        public FacilityMatrix(string code, int value)
        {
            Code = code;
            Value = value;
        }

        public string Code { get; set; }

        public int Value { get; set; } = 0;
    }
}