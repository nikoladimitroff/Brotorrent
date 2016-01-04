using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace Brotorrent
{
    public class BroViewmodel : IBroEventListener
    {
        public ObservableCollection<PublishedFile> PublishedFiles { get; private set; }
        public string Author
        {
            get
            {
                return Bridge.Author;
            }
            set
            {
                Bridge.Author = value;
            }
        }

        public class FileDownload : INotifyPropertyChanged
        {
            private double progress;

            public string Filename { get; set; }
            public string DownloadLocation { get; set; }
            public uint Size { get; set; }
            public string ReadableSize
            {
                get
                {
                    return PublishedFile.MakeSizeReadable(Size);
                }
            }
            public double Progress
            {
                get { return progress; }
                set
                {
                    progress = value;
                    NotifyPropertyChanged();
                }
            }

            public event PropertyChangedEventHandler PropertyChanged;
            private void NotifyPropertyChanged([CallerMemberName] String propertyName = "")
            {
                if (PropertyChanged != null)
                {
                    PropertyChanged(this, new PropertyChangedEventArgs(propertyName));
                }
            }

        }
        public ObservableCollection<FileDownload> Downloads { get; private set; }

        private BroApiClientBridge Bridge;

        public BroViewmodel()
        {
            this.PublishedFiles = new ObservableCollection<PublishedFile>();
            this.Downloads = new ObservableCollection<FileDownload>();
            this.Bridge = new BroApiClientBridge(this);
            this.Bridge.Init();
            this.Author = "<Annonymous>";
        }

        public async Task RefreshFiles()
        {
            await this.Bridge.RefreshFiles();
            this.PublishedFiles.Clear();
            foreach (var file in this.Bridge.PublishedFiles)
            {
                this.PublishedFiles.Add(file);
            }
        }

        public async void Publish(string filename, string pathToFile, string description)
        {
            await this.Bridge.Publish(filename, pathToFile, description);
        }

        public string GetLog()
        {
            return this.Bridge.GetLog();
        }

        public async void Download(PublishedFile publishedFile, string downloadLocation)
        {
            await this.Bridge.Download(publishedFile.Filename, downloadLocation);
            var download = new FileDownload()
            {
                Filename = publishedFile.Filename,
                DownloadLocation = downloadLocation,
                Size = publishedFile.Size,
                Progress = 0
            };
            this.Downloads.Add(download);
        }

        // IBroEventListener
        public void OnError(string error)
        {
            Console.WriteLine(error);
        }

        public void OnProgress(string file, float progress)
        {
            var download = this.Downloads.First(f => f.Filename == file);
            download.Progress = progress;
        }
    }
}
