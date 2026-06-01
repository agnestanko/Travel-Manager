using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

using Travel_Manager_API.Controllers;

public class TicketsControllerTests
{
    // -------------------------
    // DB InMemory
    // -------------------------
    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    // -------------------------
    // Fake controller + user
    // -------------------------
    private TicketsController CreateController(AppDbContext context, int userId)
    {
        var controller = new TicketsController(context);

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
    // TEST 1: BUY TICKETS OK
    // -------------------------
    [Fact]
    public async Task BuyTickets_Should_Return_Ok()
    {
        var context = GetDbContext();

        context.Attractions.Add(new Attraction(
            "Museum",
            "Museum",
            "Nice place",
            "Cluj",
            100,
            50
        )
        {
            Id = 1
        });

        context.AvailableDates.Add(
            new AvailableDate(DateTime.Today, 1)
            {
                Id = 1
            }
        );

        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var request = new BuyTicketsRequest
        {
            AttractionId = 1,
            Quantity = 2,
            EntryDate = DateTime.Today.ToString("yyyy-MM-dd")
        };

        var result = await controller.BuyTickets(request);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    // -------------------------
    // TEST 2: INVALID ATTRACTION
    // -------------------------
    [Fact]
    public async Task BuyTickets_Should_Return_NotFound_When_Attraction_Invalid()
    {
        var context = GetDbContext();
        var controller = CreateController(context, 1);

        var request = new BuyTicketsRequest
        {
            AttractionId = 999,
            Quantity = 1,
            EntryDate = DateTime.Today.ToString("yyyy-MM-dd")
        };

        var result = await controller.BuyTickets(request);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------
    // TEST 3: CANCEL TICKET
    // -------------------------
    [Fact]
    public async Task CancelTicket_Should_Work_When_Owner()
    {
        var context = GetDbContext();

        var booking = new Booking(1, 1, 50, DateOnly.FromDateTime(DateTime.Today));
        context.Bookings.Add(booking);
        await context.SaveChangesAsync();

        var ticket = new Ticket(booking.Id, 1, DateOnly.FromDateTime(DateTime.Today));
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var controller = CreateController(context, 1);

        var result = await controller.CancelTicket(ticket.Id);

        Assert.IsType<OkObjectResult>(result);
    }

    // -------------------------
    // TEST 4: FORBIDDEN USER
    // -------------------------
    [Fact]
    public async Task CancelTicket_Should_Return_Forbid_When_NotOwner()
    {
        var context = GetDbContext();

        var booking = new Booking(2, 1, 50, DateOnly.FromDateTime(DateTime.Today));
        context.Bookings.Add(booking);
        await context.SaveChangesAsync();

        var ticket = new Ticket(booking.Id, 1, DateOnly.FromDateTime(DateTime.Today));
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var result = await controller.CancelTicket(ticket.Id);

        Assert.IsType<ForbidResult>(result);
    }
}