using Class_Library_Travel_Manager;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Attraction> Attractions { get; set; }
    public DbSet<AttractionImage> AttractionImages { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Reviews> Reviews { get; set; }
    public DbSet<AvailableDate> AvailableDates { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==============================
        // Relația User → Bookings (1 → many)
        // ==============================
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ==============================
        // Relația Booking → Tickets (1 → many)
        // ==============================
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Booking)
            .WithMany(b => b.Tickets)
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        // ==============================
        // Relația Ticket → Attraction (many → 1)
        // ==============================
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Attraction)
            .WithMany()
            .HasForeignKey(t => t.AttractionId);

        // ==============================
        // Relația Reviews → User (many → 1)
        // ==============================
        modelBuilder.Entity<Reviews>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId);

        // ==============================
        // Relația Reviews → Attraction (many → 1)
        // ==============================
        modelBuilder.Entity<Reviews>()
            .HasOne(r => r.Attraction)
            .WithMany()
            .HasForeignKey(r => r.AttractionId);

        // ==============================
        // Relația AvailableDate → Attraction (many → 1)
        // ==============================
        modelBuilder.Entity<AvailableDate>()
            .HasOne(a => a.Attraction)
            .WithMany(att => att.AvailableDates)
            .HasForeignKey(a => a.AttractionId);

        // ==============================
        // Relația Many-to-Many: User <-> Attraction (favorite)
        // ==============================
        modelBuilder.Entity<User>()
            .HasMany(u => u.FavoriteAttractions)
            .WithMany(a => a.UsersWhoFavorited)
            .UsingEntity(j => j.ToTable("UserFavoriteAttractions"));

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<AttractionImage>()
            .HasOne(img => img.Attraction)
            .WithMany(a => a.Images)
            .HasForeignKey(img => img.AttractionId);

    }
}