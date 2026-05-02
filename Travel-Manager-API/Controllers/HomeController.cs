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
    }
}