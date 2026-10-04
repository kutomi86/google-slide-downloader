const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  console.log('\n🧹 Starting post-build cleanup...');
  
  const files = fs.readdirSync(distPath);
  
  files.forEach(file => {
    // We want to KEEP the main Setup executable.
    // electron-builder often generates a blockmap, yaml files, the win-unpacked folder,
    // and sometimes an uninstaller executable. We only want the main setup.
    if (file.endsWith('.exe') && !file.includes('uninstaller')) {
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
  
  console.log('✨ Cleanup complete! Only the standalone executable remains in dist/.\n');
}
