using System.Collections.Generic;

namespace Class_Library_Travel_Manager
{
    public class Attraction
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public int Capacity { get; set; }
        public int EntryPrice { get; set; }
        public ICollection<AvailableDate> AvailableDates { get; set; }
        public ICollection<User> UsersWhoFavorited { get; set; }
        public ICollection<AttractionImage> Images { get; set; }

        private Attraction() { }

        public Attraction(string name, string type, string description, string location, int capacity, int entryPrice)
        {
            Name = name;
            Type = type;
            Description = description;
            Location = location;
            Capacity = capacity;
            EntryPrice = entryPrice;
            AvailableDates = new List<AvailableDate>();
            UsersWhoFavorited = new List<User>();
            Images = new List<AttractionImage>();
        }
    }
}