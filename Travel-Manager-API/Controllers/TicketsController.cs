using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        // GET: api/Tickets/my-tickets
        // Returneaza toate biletele utilizatorului logat,
        // impreuna cu imaginea atractiei, data intrarii si data cumpararii
        [HttpGet("my-tickets")]
        [Authorize]
        public async Task<IActionResult> GetMyTickets()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var tickets = await _context.Tickets
                .Include(t => t.Booking)
                .Include(t => t.Attraction)
                    .ThenInclude(a => a.Images)
                .Where(t => t.Booking.UserId == userId)
                .OrderByDescending(t => t.Booking.DateOfPurchase)
                .Select(t => new
                {
                    t.Id,
                    AttractionName = t.Attraction.Name,
                    EntryDate = t.EntryDate.ToString("yyyy-MM-dd"),
                    DateOfPurchase = t.Booking.DateOfPurchase.ToString("yyyy-MM-dd"),
                    PricePerTicket = t.Booking.TotalPrice / t.Booking.Quantity,
                    TotalPrice = t.Booking.TotalPrice,
                    FirstImage = t.Attraction.Images.Any()
                        ? t.Attraction.Images.First().ImagePath
                        : null
                })
                .ToListAsync();

            return Ok(tickets);
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

        // Adaugă acest endpoint în TicketsController.cs
        // (în clasa TicketsController, după metoda GetMyTickets)

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

            // Gasim biletul împreună cu booking-ul asociat
            var ticket = await _context.Tickets
                .Include(t => t.Booking)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null)
                return NotFound("Ticket not found.");

            // Verificam ca biletul apartine utilizatorului logat
            if (ticket.Booking.UserId != userId)
                return Forbid();

            // Nu permitem anularea biletelor expirate (data de intrare a trecut)
            if (ticket.EntryDate < DateOnly.FromDateTime(DateTime.Today))
                return BadRequest("Cannot cancel expired tickets.");

            _context.Tickets.Remove(ticket);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ticket cancelled successfully. Refund will be processed in 3-5 business days." });
        }
    }

    public class BuyTicketsRequest
    {
        public int AttractionId { get; set; }
        public int Quantity { get; set; }
        public string EntryDate { get; set; }
    }
}