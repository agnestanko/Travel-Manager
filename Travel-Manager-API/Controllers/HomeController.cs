using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HomeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/home
        // Returneaza toate atractiile (frontend le va afisa in ordine aleatoare)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetHomeData()
        {
            var attractions = await _context.Attractions
                .Include(a => a.Images)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    FirstImage = a.Images.Any()
                        ? a.Images.First().ImagePath
                        : null
                })
                .ToListAsync();

            return Ok(attractions);
        }

        // GET: api/home/popular
        // Returneaza atractiile sortate descrescator dupa numarul de bilete vandute azi
        [HttpGet("popular")]
        public async Task<ActionResult<IEnumerable<object>>> GetPopular()
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            var popular = await _context.Attractions
                .Include(a => a.Images)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    FirstImage = a.Images.Any()
                        ? a.Images.First().ImagePath
                        : null,
                    TicketsSoldToday = _context.Tickets
                        .Count(t => t.AttractionId == a.Id && t.EntryDate == today)
                })
                .OrderByDescending(a => a.TicketsSoldToday)
                .Take(8)
                .ToListAsync();

            return Ok(popular);
        }
    }
}