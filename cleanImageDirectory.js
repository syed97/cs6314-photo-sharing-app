// reset the status of the image directory to the default

const fs = require('fs');
const path = require('path');

// Function to remove all images except specified ones
const removeImagesExcept = (directory, filesToKeep) => {
  try {
    // Read all files in the directory
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);

      // Check if the file is in the list to keep
      if (!filesToKeep.includes(file)) {
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      }
    });

    console.log('Cleanup completed!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

const imagesDirectory = path.join(__dirname, 'images'); // Replace with your directory path
const filesToKeep = [
    "kenobi1.jpg",
    "kenobi2.jpg", 
    "kenobi3.jpg", 
    "kenobi4.jpg",
    "ludgate1.jpg",
    "malcolm1.jpg",
    "malcolm2.jpg",
    "ouster.jpg",
    "ripley1.jpg",
    "ripley2.jpg",
    "took1.jpg",
    "took2.jpg"
];

removeImagesExcept(imagesDirectory, filesToKeep);
