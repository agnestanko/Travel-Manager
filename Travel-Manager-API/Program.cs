using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using Travel_Manager_API.Controllers;

var builder = WebApplication.CreateBuilder(args);

// Legăm secțiunea "Jwt" la clasa JwtSettings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// Adăugăm autentificarea cu JWT
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy => policy.WithOrigins("http://localhost:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!context.Attractions.Any())
    {
        var bran = new Attraction(
            "Castelul Bran",
            "Istoric",
            "Castel medieval asociat cu legenda lui Dracula.",
            "Brașov",
            1000,
            70
        );

        bran.Images.Add(new AttractionImage("/images/attractions/bran1.jpg"));

        bran.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(1), 0));
        bran.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(2), 0));
        bran.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(5), 0));



        var peles = new Attraction(
            "Castelul Peleș",
            "Istoric",
            "Castel regal din Sinaia.",
            "Sinaia",
            900,
            80
        );

        peles.Images.Add(new AttractionImage("/images/attractions/peles1.jpg"));

        peles.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(1), 0));
        peles.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(4), 0));
        peles.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(7), 0));



        var salina = new Attraction(
            "Salina Turda",
            "Natură",
            "Salină transformată în atracție turistică.",
            "Turda",
            500,
            50
        );

        salina.Images.Add(new AttractionImage("/images/attractions/salina1.jpg"));

        salina.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(2), 0));
        salina.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(3), 0));
        salina.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(6), 0));



        var therme = new Attraction(
            "Therme București",
            "Relaxare",
            "Centru wellness și aquapark modern.",
            "București",
            2000,
            120
        );

        therme.Images.Add(new AttractionImage("/images/attractions/therme1.jpg"));

        therme.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(1), 0));
        therme.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(2), 0));
        therme.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(3), 0));



        var alba = new Attraction(
            "Cetatea Alba Carolina",
            "Istoric",
            "Cetate fortificată de tip Vauban.",
            "Alba Iulia",
            1500,
            40
        );

        alba.Images.Add(new AttractionImage("/images/attractions/alba1.jpg"));

        alba.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(1), 0));
        alba.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(5), 0));
        alba.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(8), 0));



        var dino = new Attraction(
            "Dino Parc Râșnov",
            "Distracție",
            "Parc tematic cu dinozauri în mărime naturală.",
            "Râșnov",
            1200,
            65
        );

        dino.Images.Add(new AttractionImage("/images/attractions/dino1.jpg"));

        dino.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(2), 0));
        dino.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(4), 0));
        dino.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(6), 0));



        var delta = new Attraction(
            "Delta Dunării",
            "Natură",
            "Rezervație naturală unică în Europa.",
            "Tulcea",
            300,
            150
        );

        delta.Images.Add(new AttractionImage("/images/attractions/delta1.jpg"));

        delta.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(3), 0));
        delta.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(7), 0));
        delta.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(10), 0));



        var nymphaea = new Attraction(
            "AquaPark Nymphaea",
            "Distracție",
            "Complex acvatic modern.",
            "Oradea",
            1000,
            90
        );

        nymphaea.Images.Add(new AttractionImage("/images/attractions/nymphaea1.jpg"));

        nymphaea.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(1), 0));
        nymphaea.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(2), 0));
        nymphaea.AvailableDates.Add(new AvailableDate(DateTime.Today.AddDays(9), 0));



        context.Attractions.AddRange(
            bran,
            peles,
            salina,
            therme,
            alba,
            dino,
            delta,
            nymphaea
        );

        context.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();