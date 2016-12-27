using FaceApiWebTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace FaceApiWebTest.Controllers
{
    [RequireHttps]
    public class HomeController : Controller
    {
        public IConfiguration Configuration { get; }

        public HomeController(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IActionResult Index()
        {
            var model = new ApiKeyModel()
            {
                AzureApiKey = Configuration["ApiKeys:Azure"],
                GoogleApiKey = Configuration["ApiKeys:Google"],
                AmazonAccessKeyId = Configuration["ApiKeys:Amazon:AccessKeyId"],
                AmazonSecretAccessKey = Configuration["ApiKeys:Amazon:SecretAccessKey"]
            };
            return View(model);
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
