using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.IO.Compression;

namespace Odyssey.Web
{
	public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);
			builder.Services
				.AddHsts(options => {
					options.Preload = true;
					options.IncludeSubDomains = true;
					options.MaxAge = TimeSpan.FromDays(1);
				})
				.AddHttpsRedirection(options => { })
				.AddResponseCompression(options => {
					options.EnableForHttps = true;
					options.Providers.Add<GzipCompressionProvider>();
					options.Providers.Add<BrotliCompressionProvider>();
				})
				.Configure<GzipCompressionProviderOptions>(options => {
					options.Level = CompressionLevel.Optimal;
				})
				.Configure<BrotliCompressionProviderOptions>(options => {
					options.Level = CompressionLevel.Optimal;
				})
				.AddRazorPages();

			var app = builder.Build();
			var isDevelopment = app.Environment.IsDevelopment();
			if (!isDevelopment) {
				app.UseExceptionHandler("/error");
				app.UseHsts();
				app.UseHttpsRedirection();
				app.UseResponseCompression();
			}

			app.Use(async (context, next) => {
				context.Response.Headers.Remove("X-Powered-By");
				await next();
			});

			app.UseStaticFiles(new StaticFileOptions {
				OnPrepareResponse = context => {
					//ES modules are loaded unbundled in development, so make the browser revalidate them on every reload
					if (isDevelopment)
						context.Context.Response.Headers.CacheControl = "no-cache";
				}
			});

			app.UseRouting();
			app.MapRazorPages();
			app.Run();
		}
	}
}
