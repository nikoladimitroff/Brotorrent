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
    /// Interaction logic for PublishFileWindow.xaml
    /// </summary>
    public partial class PublishFileWindow : Window
    {
        public string Filename
        {
            get
            {
                return this.filenameTextbox.Text;
            }
        }
        public string Description
        {
            get
            {
                return new TextRange(this.descriptionTextarea.Document.ContentStart,
                                     this.descriptionTextarea.Document.ContentEnd).Text;
            }
        }
        public string PathToFile
        {
            get
            {
                return this.pathTextbox.Text;
            }
        }

        public PublishFileWindow()
        {
            InitializeComponent();
        }

        private void browseToFileButton_Click(object sender, RoutedEventArgs e)
        {
            var fileDialog = new Microsoft.Win32.OpenFileDialog();
            fileDialog.Filter = "All files (*.*)|*.*";
            var result = fileDialog.ShowDialog();
            if (result == false)
                return;
            pathTextbox.Text = fileDialog.FileName;
            filenameTextbox.Text = System.IO.Path.GetFileName(fileDialog.FileName);
        }

        private void publishButton_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = true;
            this.Close();
        }
    }
}
