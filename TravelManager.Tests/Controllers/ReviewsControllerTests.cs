using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Reviews/{attractionId}
        // Returneaza toate review-urile pentru o atractie
        // Daca utilizatorul este autentificat, returneaza si canReview (are bilet expirat + nu a recenzat deja)
        [HttpGet("{attractionId}")]
        public async Task<IActionResult> GetReviews(int attractionId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.AttractionId == attractionId)
                .OrderByDescending(r => r.DateOfReview)
                .Select(r => new
                {
                    r.Id,
                    r.Comment,
                    r.Rating,
                    DateOfReview = r.DateOfReview.ToString("yyyy-MM-dd"),
                    UserName = r.User.Name + " " + r.User.Surname,
                    r.UserId
                })
                .ToListAsync();

            // Verificam optional daca userul autentificat poate lasa un review
            bool? canReview = null;
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (int.TryParse(userIdStr, out int userId))
            {
                var today = DateOnly.FromDateTime(DateTime.Today);

                var hasExpiredTicket = await _context.Tickets
                    .Include(t => t.Booking)
                    .AnyAsync(t => t.AttractionId == attractionId
                                && t.Booking.UserId == userId
                                && t.EntryDate < today);

                var alreadyReviewed = reviews.Any(r => r.UserId == userId);

                canReview = hasExpiredTicket && !alreadyReviewed;
            }

            return Ok(new { reviews, canReview });
        }

        // POST: api/Reviews/{attractionId}
        // Adauga un review pentru o atractie (un singur review per user per atractie)
        // Userul trebuie sa aiba cel putin un bilet expirat pentru acea atractie
        [HttpPost("{attractionId}")]
        [Authorize]
        public async Task<IActionResult> AddReview(int attractionId, [FromBody] AddReviewRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            // Verificam ca atractia exista
            var attractionExists = await _context.Attractions.AnyAsync(a => a.Id == attractionId);
            if (!attractionExists)
                return NotFound("Attraction not found.");

            // Verificam ca userul are cel putin un bilet expirat pentru aceasta atractie
            var today = DateOnly.FromDateTime(DateTime.Today);
            var hasExpiredTicket = await _context.Tickets
                .Include(t => t.Booking)
                .AnyAsync(t => t.AttractionId == attractionId
                            && t.Booking.UserId == userId
                            && t.EntryDate < today);

            if (!hasExpiredTicket)
                return Forbid();

            // Verificam ca userul nu a mai lasat deja un review
            var alreadyReviewed = await _context.Reviews
                .AnyAsync(r => r.AttractionId == attractionId && r.UserId == userId);
            if (alreadyReviewed)
                return Conflict("You have already reviewed this attraction.");

            // Validam rating-ul
            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest("Rating must be between 1 and 5.");

            if (string.IsNullOrWhiteSpace(request.Comment))
                return BadRequest("Comment cannot be empty.");

            var review = new Reviews(userId, attractionId, request.Comment.Trim(), request.Rating, DateOnly.FromDateTime(DateTime.Today));
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // Returnam review-ul cu numele userului
            var user = await _context.Users.FindAsync(userId);

            return Ok(new
            {
                review.Id,
                review.Comment,
                review.Rating,
                DateOfReview = review.DateOfReview.ToString("yyyy-MM-dd"),
                UserName = user!.Name + " " + user.Surname,
                review.UserId
            });
        }

        // DELETE: api/Reviews/{id}
        // Sterge un review (doar autorul sau admin)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var review = await _context.Reviews
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
                return NotFound("Review not found.");

            var currentUser = await _context.Users.FindAsync(userId);
            if (review.UserId != userId && !(currentUser?.IsAdmin ?? false))
                return Forbid();

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review deleted." });
        }
    }

    public class AddReviewRequest
    {
        public string Comment { get; set; }
        public int Rating { get; set; }
    }
}