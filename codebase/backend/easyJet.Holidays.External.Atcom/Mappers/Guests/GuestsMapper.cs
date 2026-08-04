using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Utils;
using System.Globalization;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;

namespace easyJet.Holidays.External.Atcom.Mappers.Guests
{
    public class GuestsMapper : IGuestsMapper
    {
        private readonly ITransliterationService _transliterationService;

        public GuestsMapper(ITransliterationService transliterationService)
        {
            _transliterationService = transliterationService;
        }

        public static Models.Internal.Person MapLeadPassenger(LeadPassenger leadPassenger)
        {
            if (leadPassenger == null)
            {
                return new Models.Internal.Person();
            }

            return new Models.Internal.Person
            {
                Add = new[]
                {
                    new Add
                    {
                        Name = leadPassenger.Address,
                        Street = leadPassenger.Address2,
                        ZipCode = leadPassenger.PostCode,
                        City = leadPassenger.TownCity,
                        CountryISOCode = leadPassenger.CountryCode
                    }
                },
                Email = new[]
                {
                    new Email_Type
                    {
                        Address = leadPassenger.Email,
                        Sphere = Sphere.SPHERE_PRIVATE // TODO: manage this separately for business vs private holidays?
                    }
                },
                Comm = new[]
                {
                    new Comm
                    {
                        CommType = CommCommType.TYPE_MOBILE,
                        Sphere = Sphere.SPHERE_PRIVATE,
                        Num = leadPassenger.Phone,
                        AreaCode = leadPassenger.DialingCode,
                        CountryCode = leadPassenger.CountryCode
                    }
                }
            };
        }

        /// <inheritdoc/>
        public PersonWithDetails MapGuest(Pax pax)
        {
            int.TryParse(pax.Age, out var age);

            // common fields for all
            var person = new PersonWithDetails()
            {
                FirstName = _transliterationService.ToEnglish(pax.Person?.FirstName),
                LastName = _transliterationService.ToEnglish(pax.Person?.LastName),
                Sex = MapSex(pax.Person?.Sex ?? PersonSex.SEX_UNKNOWN),
                Type = MapType(pax.Pax_Tp),
                IsLead = pax.Lead_Pax,
                Index = pax.Index,
                Age = age,
                DateOfBirth = string.IsNullOrWhiteSpace(pax.Person?.DateOfBirth)
                    ? (DateTimeOffset?)null
                    : DateFormatUtils.Parse(pax.Person?.DateOfBirth)
            };

            person.Title = pax.Person?.Title;


            return person;
        }

        /// <inheritdoc/>
        public LeadPassenger MapLeadPassenger(Pax pax, Models.Internal.Person customerDetails)
        {
            var leadPassenger = new LeadPassenger(MapGuest(pax));
            leadPassenger.DateOfBirth = DateFormatUtils.Parse(pax.Person?.DateOfBirth);

            // Address
            var address = customerDetails?.Add?.FirstOrDefault();
            if (address != null)
            {
                leadPassenger.Address = address.Name;
                leadPassenger.Address2 = address.Street;
                leadPassenger.PostCode = address.ZipCode;
                leadPassenger.TownCity = address.City;
            }

            // Phone number
            var comms = customerDetails?.Comm?.FirstOrDefault(x => x.CommType == CommCommType.TYPE_PHONE);
            if (comms != null)
            {
                leadPassenger.Phone = comms.Num;
            }

            // Email
            var email = customerDetails?.Email?.FirstOrDefault();
            if (email != null)
            {
                leadPassenger.Email = email.Address;
            }

            return leadPassenger;
        }

        public static Sex MapSex(PersonSex sex)
        {
            switch (sex)
            {
                case PersonSex.SEX_UNKNOWN:
                    return Sex.Unknown;

                case PersonSex.SEX_MALE:
                    return Sex.Male;

                case PersonSex.SEX_FEMALE:
                    return Sex.Female;
                default:
                    return Sex.Unknown;
            }
        }

        public static PersonSex MapSex(Sex sex)
        {
            if (sex == Sex.Male) return PersonSex.SEX_MALE;
            if (sex == Sex.Female) return PersonSex.SEX_FEMALE;

            return PersonSex.SEX_UNKNOWN;
        }

        public static Pax_Tp MapType(PersonType type)
        {
            switch (type)
            {
                case PersonType.Adult:
                    return Pax_Tp.ADULT;

                case PersonType.Child:
                    return Pax_Tp.CHILD;

                case PersonType.Infant:
                    return Pax_Tp.INFANT;
                default:
                    return Pax_Tp.ADULT;
            }
        }

        public static PersonType MapType(Pax_Tp type)
        {
            switch (type)
            {
                case Pax_Tp.ADULT:
                    return PersonType.Adult;

                case Pax_Tp.CHILD:
                    return PersonType.Child;

                case Pax_Tp.INFANT:
                    return PersonType.Infant;
                default:
                    return PersonType.Adult;
            }
        }

        public Pax[] Map(IEnumerable<PersonWithDetails> personWithDetails)
        {
            var pax = personWithDetails.Select((x) => new Pax
            {
                Index = x.Index,
                Lead_Pax = x.IsLead,
                Lead_PaxSpecified = x.IsLead,
                Age = x.Age.ToString(),
                Pax_Tp = MapType(x.Type),
                Pax_TpSpecified = true,
                Person = new Models.Internal.Person
                {
                    FirstName = _transliterationService.ToEnglish(x.FirstName),
                    LastName = _transliterationService.ToEnglish(x.LastName),
                    Title = x.Title,
                    DateOfBirth = DateFormatUtils.DateOnly(x.DateOfBirth),
                    Sex = MapSex(x.Sex),
                    SexSpecified = true,
                },
            }).ToArray();

            return pax;
        }

        /// <summary>
        /// Generates the <see cref="SubServPax"/> associated to each passenger.
        /// </summary>
        /// <param name="orderedGuests">The guests in the right order</param>
        /// <param name="routePaxs">The passengers of a route</param>
        /// <returns>The <see cref="SubServPax"/> associated to each passenger</returns>
        public static SubServPax[] MapRoutePax(IEnumerable<Person> orderedGuests, IEnumerable<RoutePax> routePaxs)
        {
            var pnr = routePaxs?.FirstOrDefault()?.ExternalPNR;
            var externalRefId = pnr.IsNullOrEmpty() ? null : new Ext_Ref_Id() { Code = pnr, System = AtcomConstants.SubSystemCode, };
            var allPaxs = orderedGuests.Select((x, idx) => new SubServPax
            {
                Pax_Id = (idx + 1).ToString(CultureInfo.InvariantCulture),
                Ext_Ref_Id = externalRefId
            }).ToArray();

            return allPaxs;
        }

        /// <summary>
        /// Sort guests in right order: adults, children, infants
        /// </summary>
        /// <param name="guests"></param>
        /// <returns></returns>
        public static IEnumerable<T> SortGuests<T>(List<T> guests, Func<T, PersonType> getType)
        {
            return guests.OrderBy(p =>
            {
                var type = getType(p);
                if (type == PersonType.Adult) return 0;
                if (type == PersonType.Child) return 1;
                return 2;
            }).ToList();
        }
    }
}