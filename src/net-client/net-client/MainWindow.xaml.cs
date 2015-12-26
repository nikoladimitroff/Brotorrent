using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Brotorrent
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private BroViewmodel Viewmodel;
        public MainWindow()
        {
            InitializeComponent();

            this.Viewmodel = new BroViewmodel();
            this.DataContext = this.Viewmodel;
        }

        private async void refreshButton_Click(object sender, RoutedEventArgs e)
        {
            await this.Viewmodel.RefreshFiles();
        }

        private void publishButton_Click(object sender, RoutedEventArgs e)
        {
            var publishWindow = new PublishFileWindow();
            publishWindow.Owner = this;
            bool? shouldPublish = publishWindow.ShowDialog();
            if (shouldPublish.GetValueOrDefault())
            {
                this.Viewmodel.Publish(publishWindow.Filename, publishWindow.PathToFile, publishWindow.Description);
            }
        }

        private void logButton_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show(this.Viewmodel.GetLog(), "Log");
        }

        private void downloadButton_Click(object sender, RoutedEventArgs e)
        {
            Button target = sender as Button;
            var filename = target.CommandParameter as string;
            var publishedFile = this.Viewmodel.PublishedFiles.First(f => f.Filename == filename);
            var downloadWindow = new DownloadFileWindow(publishedFile);
            downloadWindow.Owner = this;
            var shouldDownload = downloadWindow.ShowDialog();
            if (shouldDownload.GetValueOrDefault())
            {
                this.Viewmodel.Download(publishedFile, downloadWindow.DownloadLocation);
            }
        }

        private void deleteButton_Click(object sender, RoutedEventArgs e)
        {

        }

        private void showInFolderButton_Click(object sender, RoutedEventArgs e)
        {
            Button target = sender as Button;
            var filename = target.CommandParameter as string;
            var download = this.Viewmodel.Downloads.First(f => f.Filename == filename);
            var dirName = System.IO.Path.GetDirectoryName(download.DownloadLocation);
            System.Diagnostics.Process.Start(dirName);
        }
    }
}
