const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  console.log('\n🧹 Starting post-build cleanup...');
  
  const files = fs.readdirSync(distPath);
  const releaseInstallerPattern = /Setup[ .].*\.exe$/i;
  
  files.forEach(file => {
    // Keep only the installer and the update metadata that GitHub Releases and electron-updater need.
    if (file === 'latest.yml' || file.endsWith('.blockmap') || releaseInstallerPattern.test(file)) {
      console.log(`✅ Keeping: ${file}`);
      return; 
    }
    
    const filePath = path.join(distPath, file);
    try {
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`🗑️  Deleted directory: ${file}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted file: ${file}`);
      }
    } catch (err) {
      console.error(`⚠️  Failed to delete ${file}:`, err.message);
    }
  });
  
  console.log('✨ Cleanup complete! Only release-ready installer files remain in dist/.\n');
}
