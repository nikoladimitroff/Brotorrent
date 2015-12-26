using Newtonsoft.Json;
using System;
using System.Linq;

namespace Brotorrent
{
    public struct PublishedFile
    {
        [JsonProperty("name")]
        public string Filename { get; set; }
        [JsonProperty("author")]
        public string Author { get; set; }
        [JsonProperty("description")]
        public string Description { get; set; }
        [JsonProperty("broseeders")]
        public string[] BroSeeders { get; set; }
        [JsonProperty("size")]
        public uint Size { get; set; }

        public string ReadableSize
        {
            get
            {
                return MakeSizeReadable(Size);
            }
        }

        public static string MakeSizeReadable(uint size)
        {
            var commonUnits = new ulong[] { 1 << 10, 1 << 20, 1 << 30 };
            var commonUnitsNames = new string[] { "KB", "MB", "GB" };
            float realSize = (float)size;
            for (int i = 0; i < commonUnits.Length; i++)
            {
                float normalizedSize = size / commonUnits[i];
                if (normalizedSize < 1000)
                {
                    return String.Format("{0} {1}", Math.Ceiling(normalizedSize), commonUnitsNames[i]);
                }
            }
            return String.Format("{0} {1}", Math.Ceiling(realSize / commonUnits.Last()), commonUnitsNames.Last());
        }
    }
}
