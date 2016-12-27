using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Amazon.Rekognition;
using Amazon;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;
using Amazon.Rekognition.Model;
using System.IO;
using FaceApiWebTest.Models;
using System.Diagnostics;
using System.Net.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http.Headers;
using System.Collections.Generic;
using System.Text;

namespace FaceApiWebTest.Controllers
{
    public class FaceController : Controller
    {
        public IConfiguration Configuration { get; }

        public FaceController(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        [HttpPost]
        [Route("api/amazon/face-detect")]
        public async Task<IActionResult> AmazonFaceDetection([FromBody] FaceDetectModel model)
        {
            var accessKeyId = Configuration["ApiKeys:Amazon:AccessKeyId"];
            var secretAccessKey = Configuration["ApiKeys:Amazon:SecretAccessKey"];

            var credentials = new BasicAWSCredentials(accessKeyId, secretAccessKey);
            var region = RegionEndpoint.USWest2;
            var client = new AmazonRekognitionClient(credentials, region);

            var bytes = Convert.FromBase64String(model.Data);
            using (var mem = new MemoryStream(bytes))
            {
                try
                {
                    var request = new DetectFacesRequest();
                    request.Image = new Image();
                    request.Image.Bytes = mem;

                    var response = await client.DetectFacesAsync(request);
                    var results = from face in response.FaceDetails
                                  let box = face.BoundingBox
                                  select new
                                  {
                                      left = Math.Round(box.Left * model.Width),
                                      top = Math.Round(box.Top * model.Height),
                                      width = Math.Round(box.Width * model.Width),
                                      height = Math.Round(box.Height * model.Height)
                                  };
                    return Ok(results.ToList());
                }
                catch (Exception ex)
                {
                    Debug.WriteLine(ex.ToString());
                    return Ok(new object[0]);
                }
            }
        }

        [HttpPost]
        [Route("api/azure/face-detect")]
        public async Task<IActionResult> AzureFaceDetection([FromBody] FaceDetectModel model)
        {
            var key = Configuration["ApiKeys:Azure"];

            var bytes = Convert.FromBase64String(model.Data);
            using (var mem = new MemoryStream(bytes))
            {
                try
                {
                    using (var client = new HttpClient())
                    {
                        using (var content = new StreamContent(mem))
                        {
                            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                            const string uri = "https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=false";
                            using (var request = new HttpRequestMessage(HttpMethod.Post, uri))
                            {
                                request.Headers.Add("Ocp-Apim-Subscription-Key", key);
                                request.Content = content;
                                using (var response = await client.SendAsync(request))
                                {
                                    var json = await response.Content.ReadAsStringAsync();
                                    var array = JsonConvert.DeserializeObject<JArray>(json);
                                    var results =
                                        from face in array.OfType<JObject>()
                                        let box = (JObject)face["faceRectangle"]
                                        select new
                                        {
                                            left = (int)box["left"],
                                            top = (int)box["top"],
                                            width = (int)box["width"],
                                            height = (int)box["height"]
                                        };
                                    var data = results.ToList();
                                    return Ok(data);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine(ex.ToString());
                    return Ok(new object[0]);
                }
            }
        }


        [HttpPost]
        [Route("api/google/face-detect")]
        public async Task<IActionResult> GoogleFaceDetection([FromBody] FaceDetectModel model)
        {
            var key = Configuration["ApiKeys:Google"];
            try
            {
                using (var client = new HttpClient())
                {
                    var request = new GooglaFaceDetectionRequestModel(model.Data);
                    using (var content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json"))
                    {
                        var uri = "https://vision.googleapis.com/v1/images:annotate?key=" + key;
                        using (var response = await client.PostAsync(uri, content))
                        {
                            var json = await response.Content.ReadAsStringAsync();
                            var faces = JsonConvert.DeserializeObject<JObject>(json);
                            var responses = (JArray)faces["responses"];
                            var array = (JArray)((JObject)responses[0])["faceAnnotations"];
                            if (array == null) return Ok(new object[0]);

                            var results =
                                from face in array.OfType<JObject>()
                                let box = (JObject)face["boundingPoly"]
                                let vertices = ((JArray)box["vertices"]).Select(t => new { x = ((int?)t["x"]) ?? 0, y = ((int?)t["y"]) ?? 0 }).ToList()
                                select new
                                {
                                    left = vertices.Min(t => t.x),
                                    top = vertices.Min(t => t.y),
                                    width = vertices.Max(t => t.x) - vertices.Min(t => t.x) + 1,
                                    height = vertices.Max(t => t.y) - vertices.Min(t => t.y) + 1
                                };
                            var data = results.ToList();
                            return Ok(data);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.ToString());
                return Ok(new object[0]);
            }
        }
    }
}
