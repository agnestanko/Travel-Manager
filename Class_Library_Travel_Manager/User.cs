using System.Collections.Generic;

namespace Class_Library_Travel_Manager
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public bool IsAdmin { get; set; }
        public ICollection<Booking> Bookings { get; set; }
        public ICollection<Reviews> Reviews { get; set; }
        public ICollection<Attraction> FavoriteAttractions { get; set; }

        private User() { }

        public User(string name, string surname, string email, string password)
        {
            Name = name;
            Surname = surname;
            Email = email;
            Password = password;
            IsAdmin = false;
            Bookings = new List<Booking>();
            Reviews = new List<Reviews>();
            FavoriteAttractions = new List<Attraction>();
        }
    }
}