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
using System.Windows.Shapes;

namespace Brotorrent
{
    /// <summary>
    /// Interaction logic for DownloadFileWindow.xaml
    /// </summary>
    public partial class DownloadFileWindow : Window
    {
        public PublishedFile File { get; private set; }
        public uint SpaceOnDisk
        {
            get
            {
                return 0;
            }
            set
            {

            }
        }
        public string DownloadLocation
        {
            get
            {
                return this.pathTextbox.Text;
            }
        }

        public DownloadFileWindow(PublishedFile file)
        {
            InitializeComponent();
            this.File = file;
            this.DataContext = this;
        }

        private void browseToFileButton_Click(object sender, RoutedEventArgs e)
        {
            var saveFileDialog = new Microsoft.Win32.SaveFileDialog();
            var extension = System.IO.Path.GetExtension(this.File.Filename);
            saveFileDialog.Filter = "All files (*.*)|*.*";
            saveFileDialog.AddExtension = true;
            saveFileDialog.DefaultExt = extension;
            saveFileDialog.Title = String.Format("Choose where to save {0}", this.File.Filename);
            saveFileDialog.FileName = System.IO.Path.GetFileName(this.File.Filename);

            var didSave = saveFileDialog.ShowDialog();
            if (didSave.GetValueOrDefault())
            {
                this.pathTextbox.Text = saveFileDialog.FileName;
            }
        }

        private void downloadButton_Click(object sender, RoutedEventArgs e)
        {
            if (!IsPathValid(this.pathTextbox.Text))
            {
                MessageBox.Show("Invalid path!", "Error", MessageBoxButton.OK);
            }
            else
            {
                this.DialogResult = true;
                this.Close();
            }
        }

        private bool IsPathValid(string path)
        {
            System.IO.FileInfo info = null;
            try
            {
                info = new System.IO.FileInfo(path);
            }
            catch (ArgumentException) { }
            catch (System.IO.PathTooLongException) { }
            catch (NotSupportedException) { }
            return info != null;
        }
    }
}
