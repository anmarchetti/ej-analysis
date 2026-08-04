namespace easyJet.Holidays.External.Domain.Models
{
    public class FileProperties
    {
        public string FullName { get; set; }
        public DateTime? LastWriteTime { get; set; }
        public long Size { get; set; }

        public override string ToString()
        {
            return $"{FullName} : {LastWriteTime}";
        }
    }
}