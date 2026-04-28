const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envName = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'development';
const envFile = path.resolve(__dirname, `.env.${envName}`);
const defaultEnvFile = path.resolve(__dirname, '.env');

let loadedPath = defaultEnvFile;

if (fs.existsSync(envFile)) {
  loadedPath = envFile;
} else if (!fs.existsSync(defaultEnvFile)) {
  console.warn(`⚠️ Nenhum arquivo de ambiente encontrado: ${envFile} ou ${defaultEnvFile}`);
}

const result = dotenv.config({ path: loadedPath });
if (result.error) {
  if (loadedPath !== defaultEnvFile && fs.existsSync(defaultEnvFile)) {
    dotenv.config({ path: defaultEnvFile });
  }
} else {
  console.log(`✅ Carregado arquivo de ambiente: ${path.basename(loadedPath)}`);
}

module.exports = { envPath: loadedPath };
