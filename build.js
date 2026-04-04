const fs = require('fs');
const { minify } = require('terser');

const filesToBundle = [
  'js/app.js',
  'js/tools.js',
  'js/consent.js',
  'js/renderers.js',
  'js/renderers2.js',
  'js/renderers3.js',
  'js/renderers4.js',
  'js/renderers5.js',
  'js/ai.js'
];

async function bundle() {
  console.log('Bundling Javascript...');
  let combinedCode = '';
  
  for (const file of filesToBundle) {
    if (fs.existsSync(file)) {
      combinedCode += fs.readFileSync(file, 'utf8') + '\n;';
    } else {
      console.warn('Warning: Missing file ' + file);
    }
  }

  try {
    const minified = await minify(combinedCode, { format: { comments: false } });
    fs.writeFileSync('bundle.min.js', minified.code);
    console.log('Successfully created bundle.min.js (' + (minified.code.length / 1024).toFixed(2) + ' KB)');
  } catch (err) {
    console.error('Error minifying:', err);
  }
}

bundle();
