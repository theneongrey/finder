using Finder.Business.Preview.Models;
using Finder.Business.Shared;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IImageSizeService
{
    Task<Result<ImageSize>> GetImageSizeAsync(string imageUrl);
}

public class ImageSizeService : IImageSizeService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ImageSizeService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<Result<ImageSize>> GetImageSizeAsync(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl) || !Uri.IsWellFormedUriString(imageUrl, UriKind.Absolute))
        {
            return Result<ImageSize>.Fail(400, "Invalid image URL");
        }

        try
        {
            using var client = _httpClientFactory.CreateClient("PreviewClient");
            using var request = new HttpRequestMessage(HttpMethod.Get, imageUrl);
            request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(0, 2047);

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
            if (!response.IsSuccessStatusCode)
            {
                return Result<ImageSize>.Fail(500, "Failed to fetch image");
            }

            await using var stream = await response.Content.ReadAsStreamAsync();
            var buffer = new byte[2048];
            var bytesRead = await stream.ReadAsync(buffer.AsMemory());
            var bytes = buffer[..bytesRead];

            var size = ParseImageSize(bytes);
            return size.HasValue
                ? Result<ImageSize>.Success(new ImageSize(size.Value.Width, size.Value.Height))
                : Result<ImageSize>.Fail(422, "Could not determine image dimensions");
        }
        catch
        {
            return Result<ImageSize>.Fail(500, "Error fetching image");
        }
    }

    private static (int Width, int Height)? ParseImageSize(byte[] b)
    {
        if (b.Length < 12)
        {
            return null;
        }

        if (b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47)
        {
            return ParsePng(b);
        }

        if (b[0] == 0xFF && b[1] == 0xD8)
        {
            return ParseJpeg(b);
        }

        if (b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46)
        {
            return ParseGif(b);
        }

        if (b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46 &&
            b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50)
        {
            return ParseWebP(b);
        }

        return null;
    }

    // PNG: IHDR chunk at byte 8 — width at 16-19, height at 20-23 (big-endian)
    private static (int Width, int Height)? ParsePng(byte[] b)
    {
        if (b.Length < 24)
        {
            return null;
        }

        var w = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
        var h = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23];
        return (w, h);
    }

    // JPEG: scan for SOF markers (C0/C1/C2) — height at +5, width at +7 (big-endian)
    private static (int Width, int Height)? ParseJpeg(byte[] b)
    {
        var i = 2;
        while (i + 9 <= b.Length)
        {
            if (b[i] != 0xFF)
            {
                return null;
            }

            var marker = b[i + 1];
            if (marker is 0xC0 or 0xC1 or 0xC2)
            {
                var h = (b[i + 5] << 8) | b[i + 6];
                var w = (b[i + 7] << 8) | b[i + 8];
                return (w, h);
            }
            var segLen = (b[i + 2] << 8) | b[i + 3];
            i += 2 + segLen;
        }
        return null;
    }

    // GIF: width at bytes 6-7, height at 8-9 (little-endian)
    private static (int Width, int Height)? ParseGif(byte[] b)
    {
        if (b.Length < 10)
        {
            return null;
        }

        var w = b[6] | (b[7] << 8);
        var h = b[8] | (b[9] << 8);
        return (w, h);
    }

    // WebP: VP8 (lossy) and VP8L (lossless) sub-formats
    private static (int Width, int Height)? ParseWebP(byte[] b)
    {
        if (b.Length < 16)
        {
            return null;
        }

        // VP8 (lossy): key-frame start code 9D 01 2A at bytes 23-25, then 14-bit w/h
        if (b[12] == 0x56 && b[13] == 0x50 && b[14] == 0x38 && b[15] == 0x20)
        {
            if (b.Length < 30 || (b[20] & 0x01) != 0)
            {
                return null;
            }

            if (b[23] != 0x9D || b[24] != 0x01 || b[25] != 0x2A)
            {
                return null;
            }

            var w = (b[26] | (b[27] << 8)) & 0x3FFF;
            var h = (b[28] | (b[29] << 8)) & 0x3FFF;
            return (w, h);
        }

        // VP8L (lossless): signature 0x2F at byte 20, then 14-bit w/h packed in next 4 bytes
        if (b[12] == 0x56 && b[13] == 0x50 && b[14] == 0x38 && b[15] == 0x4C)
        {
            if (b.Length < 25 || b[20] != 0x2F)
            {
                return null;
            }

            var bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
            var w = (bits & 0x3FFF) + 1;
            var h = ((bits >> 14) & 0x3FFF) + 1;
            return (w, h);
        }

        return null;
    }
}
