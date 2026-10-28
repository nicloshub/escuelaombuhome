const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");

const config = require("./ftp-config.json");

// Archivos y directorios a excluir
const IGNORE_PATTERNS = [
  /^[\\\/]?node_modules/,
  /^[\\\/]?\.git/,
  /^[\\\/]?\.agent/,
  /^[\\\/]?ftp-config\.json$/,
  /^[\\\/]?deploy\.cjs$/,
  /^[\\\/]?server\.cjs$/,
  /^[\\\/]?iniciar-servidor\.bat$/,
  /^[\\\/]?package(-lock)?\.json$/,
  /\.md$/i,
  /\.log$/i,
  /\.mp4$/i
];

function shouldIgnore(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  return IGNORE_PATTERNS.some(pattern => pattern.test(normalized));
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(baseDir, fullPath);
    if (shouldIgnore(relPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push({
        fullPath,
        relPath: relPath.replace(/\\/g, "/"),
        size: stat.size,
        mtime: stat.mtime
      });
    }
  }
  return results;
}

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  console.log("==========================================");
  console.log("🚀 Iniciando despliegue en:", config.host);
  console.log("📁 Directorio remoto:", config.remoteRoot);
  console.log("==========================================\n");

  try {
    await client.access({
      host: config.host,
      port: config.port || 21,
      user: config.user,
      password: config.password,
      secure: config.secure !== false,
      secureOptions: { rejectUnauthorized: false }
    });

    console.log("✔ Conexión FTPS autenticada con éxito.");

    // Asegurar directorio raíz remoto
    await client.ensureDir(config.remoteRoot);

    const localFiles = getAllFiles(__dirname);
    console.log(`📦 Archivos locales a procesar: ${localFiles.length}\n`);

    let uploadedCount = 0;
    let skippedCount = 0;
    let currentRemoteDir = "";

    // Cache de archivos remotos por directorio
    const remoteDirCache = new Map();

    async function getRemoteFilesForDir(dirPath) {
      if (!remoteDirCache.has(dirPath)) {
        try {
          await client.cd(dirPath);
          const list = await client.list();
          const map = new Map();
          for (const item of list) {
            if (!item.isDirectory) {
              map.set(item.name, item.size);
            }
          }
          remoteDirCache.set(dirPath, map);
        } catch {
          remoteDirCache.set(dirPath, new Map());
        }
      }
      return remoteDirCache.get(dirPath);
    }

    for (let i = 0; i < localFiles.length; i++) {
      const file = localFiles[i];
      const relDir = path.dirname(file.relPath);
      const fileName = path.basename(file.relPath);
      const targetRemoteDir = relDir === "." ? config.remoteRoot : `${config.remoteRoot}/${relDir}`;

      // Asegurar directorio remoto
      if (currentRemoteDir !== targetRemoteDir) {
        await client.ensureDir(targetRemoteDir);
        currentRemoteDir = targetRemoteDir;
      }

      const remoteFiles = await getRemoteFilesForDir(targetRemoteDir);

      // Si existe y tiene exactamente el mismo tamaño, saltear para máxima velocidad
      if (remoteFiles.has(fileName) && remoteFiles.get(fileName) === file.size) {
        skippedCount++;
        process.stdout.write(`\r[${i + 1}/${localFiles.length}] Saltando: ${file.relPath} (sin cambios)`);
        continue;
      }

      console.log(`\n⬆ Subiendo: ${file.relPath} (${(file.size / 1024).toFixed(1)} KB)...`);
      await client.uploadFrom(file.fullPath, fileName);
      remoteFiles.set(fileName, file.size);
      uploadedCount++;
    }

    console.log("\n\n==========================================");
    console.log("🎉 ¡Despliegue completado con éxito!");
    console.log(`✔ Archivos subidos/actualizados: ${uploadedCount}`);
    console.log(`✔ Archivos omitidos (sin cambios): ${skippedCount}`);
    console.log("🌐 Podés probar la web en:");
    console.log("   👉 Home:     https://escuelaombu.com.ar/pruebas/");
    console.log("   👉 Kitesurf: https://escuelaombu.com.ar/pruebas/kitesurf/");
    console.log("==========================================");

  } catch (err) {
    console.error("\n❌ Error durante el despliegue:", err.message);
  } finally {
    client.close();
  }
}

deploy();
