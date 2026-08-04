namespace easyJet.Foundation.Atcom.Models
{
    public class DataObject
    {
        public DataObject(string code, string name)
        {
            Code = code;
            Name = name;
        }

        public string Code { get; set; }

        public string Name { get; set; }
    }
}