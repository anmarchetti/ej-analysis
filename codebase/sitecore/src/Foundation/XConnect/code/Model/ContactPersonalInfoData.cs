namespace easyJet.Foundation.XConnect.Common.Model
{
    public struct ContactPersonalInfoData
    {
        public ContactPersonalInfoData(string firstName, string lastName, string title)
        {
            FirstName = firstName;
            LastName = lastName;
            Title = title;
        }

        public string FirstName { get; }

        public string LastName { get; }

        public string Title { get; }
    }
}