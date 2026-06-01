using Microsoft.EntityFrameworkCore;
using Class_Library_Travel_Manager;

public static class DbContextFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // fiecare test DB separat
            .Options;

        return new AppDbContext(options);
    }
}