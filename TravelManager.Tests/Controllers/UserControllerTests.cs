using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Travel_Manager_API.Controllers;
using Xunit;

namespace TravelManager.Tests.Controllers
{
    public class UserControllerTests
    {
        private AppDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private UserController CreateController(AppDbContext context, int userId)
        {
            var controller = new UserController(context);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user
                }
            };

            return controller;
        }

        // -------------------------
        // UPDATE PROFILE OK
        // -------------------------
        [Fact]
        public async Task UpdateProfile_Should_Return_Ok()
        {
            var context = GetDbContext();

            var user = new User(
                "Old",
                "User",
                "old@mail.com",
                BCrypt.Net.BCrypt.HashPassword("1234")
            )
            {
                Id = 1
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, 1);

            var request = new UpdateProfileRequest
            {
                Name = "New",
                Surname = "Name",
                Email = "new@mail.com",
                Password = "1234"
            };

            var result = await controller.UpdateProfile(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        // -------------------------
        // WRONG PASSWORD
        // -------------------------
        [Fact]
        public async Task UpdateProfile_Should_Return_Unauthorized_When_WrongPassword()
        {
            var context = GetDbContext();

            var user = new User(
                "Test",
                "User",
                "test@mail.com",
                BCrypt.Net.BCrypt.HashPassword("1234")
            )
            {
                Id = 1
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, 1);

            var request = new UpdateProfileRequest
            {
                Name = "X",
                Surname = "Y",
                Email = "x@mail.com",
                Password = "wrong"
            };

            var result = await controller.UpdateProfile(request);

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        // -------------------------
        // CHANGE PASSWORD
        // -------------------------
        [Fact]
        public async Task ChangePassword_Should_Work()
        {
            var context = GetDbContext();

            var user = new User(
                "Test",
                "User",
                "test@mail.com",
                BCrypt.Net.BCrypt.HashPassword("oldpass")
            )
            {
                Id = 1
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, 1);

            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldpass",
                NewPassword = "newpass"
            };

            var result = await controller.ChangePassword(request);

            Assert.IsType<OkObjectResult>(result);
        }

        // -------------------------
        // DELETE ACCOUNT
        // -------------------------
        [Fact]
        public async Task DeleteAccount_Should_Remove_User()
        {
            var context = GetDbContext();

            var user = new User(
                "Test",
                "User",
                "test@mail.com",
                BCrypt.Net.BCrypt.HashPassword("1234")
            )
            {
                Id = 1,
                Bookings = new List<Booking>()
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, 1);

            var request = new DeleteAccountRequest
            {
                Password = "1234"
            };

            var result = await controller.DeleteAccount(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Null(await context.Users.FindAsync(1));
        }
    }
}