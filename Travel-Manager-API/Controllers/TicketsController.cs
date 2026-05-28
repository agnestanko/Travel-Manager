using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;


namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TicketsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/Tickets/buy
        // Verifica data selectata, verifica capacitatea ramasa,
        // creeaza un Booking si atatea Ticket-uri cate s-au selectat
        [HttpPost("buy")]
        [Authorize]
        public async Task<IActionResult> BuyTickets([FromBody] BuyTicketsRequest request)
        {
            // Extragem userId din JWT token (sub claim → ClaimTypes.NameIdentifier)
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            // Verificam ca atractia exista
            var attraction = await _context.Attractions.FindAsync(request.AttractionId);
            if (attraction == null)
                return NotFound("Attraction not found.");

            // Verificam ca data trimisa este o data disponibila in baza de date
            var entryDate = DateOnly.Parse(request.EntryDate);
            var entryDateTime = entryDate.ToDateTime(TimeOnly.MinValue);
            var dateExists = await _context.AvailableDates
                .AnyAsync(d => d.AttractionId == request.AttractionId
                    && d.Date.Year == entryDate.Year
                    && d.Date.Month == entryDate.Month
                    && d.Date.Day == entryDate.Day);
            if (!dateExists)
                return BadRequest("Selected date is not available for this attraction.");

            // Verificam capacitatea: cate bilete sunt deja vandute pe ziua respectiva
            var soldTickets = await _context.Tickets
                .CountAsync(t => t.AttractionId == request.AttractionId
                              && t.EntryDate == entryDate);

            int remainingCapacity = attraction.Capacity - soldTickets;
            if (request.Quantity > remainingCapacity)
                return BadRequest($"Not enough capacity. Only {remainingCapacity} spots remaining for this date.");

            // Cream booking-ul
            var today = DateOnly.FromDateTime(DateTime.Today);
            int totalPrice = attraction.EntryPrice * request.Quantity;
            var booking = new Booking(userId, request.Quantity, totalPrice, today);
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync(); // salvam ca sa obtinem booking.Id

            // Cream cate un Ticket pentru fiecare loc selectat
            for (int i = 0; i < request.Quantity; i++)
            {
                var ticket = new Ticket(booking.Id, request.AttractionId, entryDate);
                _context.Tickets.Add(ticket);
            }
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tickets purchased successfully!", bookingId = booking.Id });
        }

        // GET: api/Tickets/my-tickets?page=1&pageSize=10
        // Returneaza biletele utilizatorului logat paginat,
        // ca frontend-ul sa nu incarce toate biletele deodata.
        [HttpGet("my-tickets")]
        [Authorize]
        public async Task<IActionResult> GetMyTickets(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            if (page < 1)
                page = 1;

            if (pageSize < 1)
                pageSize = 10;

            if (pageSize > 20)
                pageSize = 20;

            var query = _context.Tickets
                .Include(t => t.Booking)
                .Include(t => t.Attraction)
                    .ThenInclude(a => a.Images)
                .Where(t => t.Booking.UserId == userId)
                .OrderByDescending(t => t.Booking.DateOfPurchase)
                .ThenByDescending(t => t.Id);

            var totalCount = await query.CountAsync();

            var tickets = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.Id,
                    AttractionName = t.Attraction.Name,
                    Location = t.Attraction.Location,
                    EntryDate = t.EntryDate.ToString("yyyy-MM-dd"),
                    DateOfPurchase = t.Booking.DateOfPurchase.ToString("yyyy-MM-dd"),
                    PricePerTicket = t.Booking.TotalPrice / t.Booking.Quantity,
                    TotalPrice = t.Booking.TotalPrice,
                    FirstImage = t.Attraction.Images.Any()
                        ? t.Attraction.Images.First().ImagePath
                        : null
                })
                .ToListAsync();

            return Ok(new
            {
                items = tickets,
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        // GET: api/Tickets/{id}/barcode
        // Returneaza codul de bare ca imagine PNG pentru un bilet specific
        // Verificam ca biletul apartine userului logat inainte de a returna imaginea
        [HttpGet("{id}/barcode")]
        [Authorize]
        public async Task<IActionResult> GetBarcode(int id)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Booking)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null)
                return NotFound();

            // Verificam ca biletul apartine userului logat
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId) || ticket.Booking.UserId != userId)
                return Forbid();

            var barcodeBytes = ticket.GenerateBarcodeBytes(300, 80);
            return File(barcodeBytes, "image/png");
        }

        // DELETE: api/Tickets/{id}
        // Anulează un bilet activ al utilizatorului logat
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> CancelTicket(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var ticket = await _context.Tickets
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Tickets)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null)
                return NotFound("Ticket not found.");

            if (ticket.Booking.UserId != userId)
                return Forbid();

            if (ticket.EntryDate < DateOnly.FromDateTime(DateTime.Today))
                return BadRequest("Cannot cancel expired tickets.");

            var booking = ticket.Booking;
            int pricePerTicket = booking.TotalPrice / booking.Quantity;

            if (booking.Tickets.Count <= 1)
            {
                _context.Bookings.Remove(booking);
            }
            else
            {
                _context.Tickets.Remove(ticket);
                booking.Quantity -= 1;
                booking.TotalPrice -= pricePerTicket;
                _context.Bookings.Update(booking);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Ticket cancelled successfully. Refund will be processed in 3-5 business days.",
                refundAmount = pricePerTicket
            });
        }

        // DELETE: api/Tickets/cancel-selected
        // Anuleaza mai multe bilete active selectate de utilizator
        [HttpDelete("cancel-selected")]
        [Authorize]
        public async Task<IActionResult> CancelSelectedTickets([FromBody] CancelSelectedTicketsRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            if (request.TicketIds == null || request.TicketIds.Count == 0)
                return BadRequest("No tickets selected.");

            var today = DateOnly.FromDateTime(DateTime.Today);

            var tickets = await _context.Tickets
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Tickets)
                .Where(t => request.TicketIds.Contains(t.Id)
                            && t.Booking.UserId == userId
                            && t.EntryDate >= today)
                .ToListAsync();

            if (!tickets.Any())
                return BadRequest("No valid active tickets selected.");

            int cancelledTickets = 0;
            int refundAmount = 0;

            var bookings = tickets
                .GroupBy(t => t.BookingId)
                .Select(g => g.First().Booking)
                .ToList();

            foreach (var booking in bookings)
            {
                var selectedTicketsForBooking = tickets
                    .Where(t => t.BookingId == booking.Id)
                    .ToList();

                if (!selectedTicketsForBooking.Any())
                    continue;

                int pricePerTicket = booking.TotalPrice / booking.Quantity;

                cancelledTickets += selectedTicketsForBooking.Count;
                refundAmount += selectedTicketsForBooking.Count * pricePerTicket;

                if (selectedTicketsForBooking.Count == booking.Tickets.Count)
                {
                    _context.Bookings.Remove(booking);
                }
                else
                {
                    _context.Tickets.RemoveRange(selectedTicketsForBooking);

                    booking.Quantity -= selectedTicketsForBooking.Count;
                    booking.TotalPrice -= selectedTicketsForBooking.Count * pricePerTicket;

                    _context.Bookings.Update(booking);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Selected tickets cancelled successfully.",
                cancelledTickets,
                refundAmount
            });
        }

        // GET: api/Tickets/my-ticket-calendar
        // Returneaza un sumar pentru calendar, fara barcode si fara toate detaliile biletelor
        [HttpGet("my-ticket-calendar")]
        [Authorize]
        public async Task<IActionResult> GetMyTicketCalendar()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var today = DateOnly.FromDateTime(DateTime.Today);

            var tickets = await _context.Tickets
                .Include(t => t.Booking)
                .Include(t => t.Attraction)
                .Where(t => t.Booking.UserId == userId)
                .Select(t => new
                {
                    t.EntryDate,
                    AttractionName = t.Attraction.Name,
                    Location = t.Attraction.Location
                })
                .ToListAsync();

            var calendarItems = tickets
                .GroupBy(t => new
                {
                    t.EntryDate,
                    t.AttractionName,
                    t.Location
                })
                .Select(g => new
                {
                    EntryDate = g.Key.EntryDate.ToString("yyyy-MM-dd"),
                    AttractionName = g.Key.AttractionName,
                    Location = g.Key.Location,
                    TotalTickets = g.Count(),
                    ActiveTickets = g.Count(t => t.EntryDate >= today),
                    ExpiredTickets = g.Count(t => t.EntryDate < today)
                })
                .OrderBy(x => x.EntryDate)
                .ToList();

            return Ok(calendarItems);
        }

    }

    public class BuyTicketsRequest
    {
        public int AttractionId { get; set; }
        public int Quantity { get; set; }
        public string EntryDate { get; set; }
    }

    public class CancelSelectedTicketsRequest
    {
        public List<int> TicketIds { get; set; } = new List<int>();
    }
}