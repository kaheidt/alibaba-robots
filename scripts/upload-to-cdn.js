/**
 * Script to upload static assets to OSS for CDN delivery
 * 
 * Usage:
 *   node scripts/upload-to-cdn.js [--build]
 *   --build  Build the project before uploading
 */

import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { exec as execCb } from 'child_process';
import dotenv from 'dotenv';

const exec = promisify(execCb);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .env or .env.terraform
let env = process.env;
try {
  const envFile = fs.existsSync(path.join(projectRoot, '.env')) 
    ? path.join(projectRoot, '.env')
    : path.join(projectRoot, 'terraform', '.env.terraform');

  if (fs.existsSync(envFile)) {
    console.log(`Loading environment variables from ${envFile}`);
    const envResult = dotenv.config({ path: envFile });
    
    if (envResult.error) {
      throw envResult.error;
    }
    
    env = { ...process.env, ...envResult.parsed };
  }
} catch (err) {
  console.error('Error loading environment variables:', err);
}

// Verify required environment variables
const requiredEnvVars = [
  'ALIBABA_OSS_REGION',
  'ALIBABA_ACCESS_KEY_ID',
  'ALIBABA_ACCESS_KEY_SECRET',
  'ALIBABA_OSS_BUCKET'
];

const missingVars = requiredEnvVars.filter(varName => !env[varName]);
if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please set these variables in your .env file or environment');
  process.exit(1);
}

console.log(`Using OSS bucket: ${env.ALIBABA_OSS_BUCKET} in region ${env.ALIBABA_OSS_REGION}`);

// OSS client configuration
const ossClient = new OSS({
  region: env.ALIBABA_OSS_REGION,
  accessKeyId: env.ALIBABA_ACCESS_KEY_ID,
  accessKeySecret: env.ALIBABA_ACCESS_KEY_SECRET,
  bucket: env.ALIBABA_OSS_BUCKET,
  secure: true
});

// Define source directories and CDN destinations
const assetMappings = [
  {
    localPath: path.join(projectRoot, 'public', 'textures'),
    cdnPath: 'textures'
  },
  {
    localPath: path.join(projectRoot, 'src', 'assets'),
    cdnPath: 'assets'
  },
  {
    localPath: path.join(projectRoot, 'public'),
    cdnPath: 'public',
    pattern: /\.svg$/
  }
];

// Assets that will be added after build
const buildMappings = [
  {
    localPath: path.join(projectRoot, 'dist', 'assets'),
    cdnPath: 'static'
  }
];

/**
 * Upload files to OSS
 */
async function uploadToOSS(localPath, cdnPath, pattern = null) {
  if (!fs.existsSync(localPath)) {
    console.log(`Warning: Path ${localPath} not found, skipping...`);
    return;
  }

  try {
    const files = getFilesRecursive(localPath);
    let uploadCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const relativePath = path.relative(localPath, file);
      const destination = path.join(cdnPath, relativePath).replace(/\\/g, '/');
      
      // Skip files that don't match the pattern if one is provided
      if (pattern && !pattern.test(file)) {
        skipCount++;
        continue;
      }
      
      console.log(`Uploading ${file} to oss://${ossClient.options.bucket}/${destination}`);
      
      try {
        const result = await ossClient.put(destination, fs.createReadStream(file));
        console.log(`  Success: https://${env.CDN_DOMAIN || 'roboverse-assets.humanless.app'}/${destination}`);
        uploadCount++;
      } catch (err) {
        console.error(`  Failed to upload ${path.basename(file)}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\nResults for ${cdnPath}:`);
    console.log(`  Uploaded: ${uploadCount} files`);
    console.log(`  Skipped: ${skipCount} files`);
    console.log(`  Errors: ${errorCount} files`);
    console.log('');
    
  } catch (err) {
    console.error(`Error processing ${localPath}:`, err);
  }
}

/**
 * Get all files in a directory recursively
 */
function getFilesRecursive(dir) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
          results = results.concat(getFilesRecursive(filePath));
        } else {
          results.push(filePath);
        }
      } catch (err) {
        console.error(`Error accessing ${filePath}:`, err.message);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  // Check if we should build the project first
  const shouldBuild = process.argv.includes('--build');
  
  if (shouldBuild) {
    console.log('Building project...');
    try {
      // Use PowerShell for build commands on Windows
      const buildCommand = process.platform === 'win32' ? 
        'powershell.exe -Command "npm run build"' : 
        'npm run build';
        
      const { stdout, stderr } = await exec(buildCommand, { cwd: projectRoot });
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      // Add dist files to the upload list
      assetMappings.push(...buildMappings);
    } catch (err) {
      console.error('Build failed:', err.message);
      return;
    }
  }
  
  console.log('Starting upload of assets to CDN...');
  
  // Upload all assets
  for (const mapping of assetMappings) {
    await uploadToOSS(
      mapping.localPath, 
      mapping.cdnPath, 
      mapping.pattern
    );
  }
  
  console.log('All assets uploaded to CDN.');
  console.log(`CDN URL: https://${env.CDN_DOMAIN || 'roboverse-assets.humanless.app'}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});