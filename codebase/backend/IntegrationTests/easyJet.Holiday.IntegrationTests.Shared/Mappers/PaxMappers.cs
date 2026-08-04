using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using System.Globalization;

namespace easyJet.Holiday.IntegrationTests.Shared.Mappers
{
    public static class PaxMappers
    {
        public static AmendPersonWithDetails MapToAmendPersonWithDetails(this PersonWithDetails person)
        {
            var result = new AmendPersonWithDetails
            {
                Age = person.Age,
                Sex = person.Sex,
                Type = person.Type,
                Title = person.Title,
                FirstName = person.FirstName,
                LastName = person.LastName,
                DateOfBirth = person.DateOfBirth,
                IsLead = person.IsLead,
                Index = person.Index,
                NotBornYet = person.NotBornYet,
                PaxNameChanged = false,
            };

            return result;
        }

        public static PersonWithDetails MapToPersonWithDetails(this CustomerInfo customerInfo, bool isLead = false)
        {
            ArgumentNullException.ThrowIfNull(customerInfo);
            var dateOfBirth = DateTimeOffset.Now.AddYears(-30);
            var age = 30;

            if (customerInfo.BirthDate is not null)
            {
                dateOfBirth = DateTimeOffset.Parse(customerInfo.BirthDate, CultureInfo.InvariantCulture);
                age = (int)((DateTimeOffset.UtcNow - dateOfBirth).TotalDays / 365);
            }

            var result = new PersonWithDetails
            {
                Title = customerInfo.Title,
                FirstName = customerInfo.FirstName,
                LastName = customerInfo.LastName,
                DateOfBirth = dateOfBirth,
                Age = age,
                IsLead = isLead,
                NotBornYet = false
            };

            return result;
        }

        public static LeadPassenger MapToLeadPassenger(this CustomerInfo customerInfo)
        {
            var result = new LeadPassenger
            {
                Email = customerInfo.Email,
                DialingCode = customerInfo.DialingCode,
                Phone = customerInfo.MobilePhone,
                CountryCode = customerInfo.CountryCode,
                Address = customerInfo.Address1,
                TownCity = customerInfo.City,
                PostCode = customerInfo.PostalCode,
                DateOfBirth = string.IsNullOrEmpty(customerInfo.BirthDate)
                    ? DateTimeOffset.UtcNow.AddYears(-30)
                    : DateTimeOffset.Parse(customerInfo.BirthDate)
            };
            return result;
        }
    }
}