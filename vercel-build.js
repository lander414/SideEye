// vercel-build.js
const { execSync } = require('child_process');

try {
  console.log('Building for Vercel...');
  execSync('vite build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}