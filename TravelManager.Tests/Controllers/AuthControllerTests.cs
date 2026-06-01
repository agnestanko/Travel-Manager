using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Travel_Manager_API.Controllers;
using Xunit;

namespace TravelManager.Tests.Controllers
{
    public class AuthControllerTests
    {
        private AppDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private IConfiguration GetConfig()
        {
            var inMemorySettings = new Dictionary<string, string>
            {
                {"Jwt:Secret", "THIS_IS_A_TEST_SECRET_KEY_123456789"},
                {"Jwt:Issuer", "testIssuer"},
                {"Jwt:Audience", "testAudience"},
                {"Jwt:ExpirationInMinutes", "60"}
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings!)
                .Build();
        }

        [Fact]
        public async Task Register_ReturnsOk_WhenNewUser()
        {
            var context = GetDbContext();
            var config = GetConfig();

            var controller = new AuthController(context, config);

            var request = new RegisterRequest
            {
                Name = "John",
                Surname = "Doe",
                Email = "john@test.com",
                Password = "123456"
            };

            var result = await controller.Register(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(1, context.Users.Count());
        }

        [Fact]
        public async Task Register_ReturnsConflict_WhenEmailExists()
        {
            var context = GetDbContext();
            var config = GetConfig();

            var user = new User("John", "Doe", "john@test.com", "hashed");
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new AuthController(context, config);

            var request = new RegisterRequest
            {
                Name = "John",
                Surname = "Doe",
                Email = "john@test.com",
                Password = "123456"
            };

            var result = await controller.Register(request);

            Assert.IsType<ConflictObjectResult>(result);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenUserNotFound()
        {
            var context = GetDbContext();
            var config = GetConfig();

            var controller = new AuthController(context, config);

            var request = new LoginRequest
            {
                Email = "missing@test.com",
                Password = "123"
            };

            var result = await controller.Login(request);

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_ReturnsToken_WhenCredentialsValid()
        {
            var context = GetDbContext();
            var config = GetConfig();

            var passwordHash = BCrypt.Net.BCrypt.HashPassword("123456");

            var user = new User("John", "Doe", "john@test.com", passwordHash);
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new AuthController(context, config);

            var request = new LoginRequest
            {
                Email = "john@test.com",
                Password = "123456"
            };

            var result = await controller.Login(request);

            var ok = Assert.IsType<OkObjectResult>(result);

            Assert.NotNull(ok.Value);
        }
    }
}