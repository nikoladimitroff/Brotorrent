using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using EdgeJs;
using Newtonsoft.Json;
using System.Collections.ObjectModel;
using System.Collections.Concurrent;

namespace Brotorrent
{
    public interface IBroEventListener
    {
        void OnError(string error);
        void OnProgress(string file, float progress);
    }

    class DummyBroEventListener : IBroEventListener
    {
        public void OnError(string error) { }
        public void OnProgress(string file, float progress)
        {
            Console.WriteLine("Progress on file {0} - {1}", file, progress);
        }
    }

    public class BroApiClientBridge
    {
        private const string PathToBridgeCode = "./api_client_bridge.js";
        private class CommandNames
        {
            public const string List = "list";
            public const string Publish = "publish";
            public const string Download = "download";
        }
        private class BridgeEventListener
        {
            public Func<object, Task<object>> onprogress;
            public Func<object, Task<object>> onerror;
        }

        public PublishedFile[] PublishedFiles { get; private set; }
        public string Author { get; internal set; }

        private Func<object, Task<object>> bridge;
        private BridgeEventListener listener;
        private IBroEventListener clientListener;

        public BroApiClientBridge(IBroEventListener clientListener)
        {
            this.Author = "";
            this.clientListener = clientListener ?? new DummyBroEventListener();
        }
    
        public async void Init()
        {
            string jsBridgeCode = File.ReadAllText(PathToBridgeCode);
            var bridgeFunc = Edge.Func(jsBridgeCode);

            this.listener = new BridgeEventListener();
            this.listener.onerror = (error) =>
            {
                this.clientListener.OnError(error as string);
                return null;
            };
            this.listener.onprogress = async (data) =>
            {
                var args = (object[])data;
                var file = Convert.ToString(args[0]);
                var progress = Convert.ToSingle(args[1]);
                this.clientListener.OnProgress(file, progress);
                return null;
            };
            var bridgeInitialize = bridgeFunc(listener);
            this.PublishedFiles = new PublishedFile[0];
            this.bridge = (Func<object, Task<object>>)await bridgeInitialize;
        }
        
        public async Task RefreshFiles()
        {
            var command = new string[] { CommandNames.List };
            string result = await this.bridge(command) as string;
            this.PublishedFiles = JsonConvert.DeserializeObject<PublishedFile[]>(result);
        }

        public async Task Download(string file, string downloadLocation)
        {
            var command = new string[] { CommandNames.Download, file, downloadLocation };
            await this.bridge(command);
        }

        public async Task Publish(string filename, string pathToFile, string description)
        {
            var fileInfo = new FileInfo(pathToFile);
            var command = new string[] { "publish", this.Author, filename, pathToFile, fileInfo.Length.ToString(), description };
            await this.bridge(command);
        }

        public string GetLog()
        {
            var command = new string[] { "log" };
            var task = this.bridge(command);
            task.Wait();
            return (string)task.Result;
        }
    }
}
