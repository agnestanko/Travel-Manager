using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // PUT: api/User/profile
        // Updateaza datele profilului doar daca parola introdusa este corecta
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            // Extragem userId din JWT token
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Verificam parola introdusa de user
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                return Unauthorized("Incorrect password. Changes have not been saved.");

            // Verificam ca noul email nu e deja folosit de alt user
            if (request.Email != user.Email)
            {
                var emailExists = await _context.Users
                    .AnyAsync(u => u.Email == request.Email && u.Id != userId);
                if (emailExists)
                    return Conflict("This email is already used by another account.");
            }

            // Actualizam datele
            user.Name = request.Name;
            user.Surname = request.Surname;
            user.Email = request.Email;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Changes have been saved.",
                user = new { user.Id, user.Name, user.Surname, user.Email }
            });
        }

        // PUT: api/User/change-password
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Verifică parola curentă
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
                return Unauthorized("Current password is incorrect.");

            // Criptează și salvează noua parolă
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        // DELETE: api/User/delete-account
        // Șterge contul utilizatorului logat după verificarea parolei
        [HttpDelete("delete-account")]
        [Authorize]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized("Invalid token.");

            var user = await _context.Users
                .Include(u => u.Bookings)
                    .ThenInclude(b => b.Tickets)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found.");

            // Verificăm parola
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                return Unauthorized("Incorrect password.");

            // Calculăm suma de rambursat pentru biletele active
            var today = DateOnly.FromDateTime(DateTime.Today);
            int refundAmount = user.Bookings
                .SelectMany(b => b.Tickets)
                .Where(t => t.EntryDate >= today)
                .Sum(t => t.Booking.TotalPrice / t.Booking.Quantity);

            // Ștergem utilizatorul — cascade delete se ocupă de:
            // Bookings → Tickets, Reviews, UserFavoriteAttractions
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Account deleted successfully.",
                refundAmount
            });
        }

    }

    public class UpdateProfileRequest
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class DeleteAccountRequest
    {
        public string Password { get; set; }
    }
}