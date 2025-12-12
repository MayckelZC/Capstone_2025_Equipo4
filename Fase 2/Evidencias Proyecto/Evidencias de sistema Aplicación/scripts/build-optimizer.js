/**
 * Script de Build Optimizer para PatitasEnCasAPP
 * Elimina automáticamente console.log en producción
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
    sourceDir: path.join(__dirname, '..', 'src', 'app'),
    excludePatterns: [
        /\.spec\.ts$/,
        /\.backup$/,
        /node_modules/
    ],
    removeConsoleInProduction: true
};

/**
 * Elimina console.log de un archivo
 */
function removeConsoleLogs(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patrón para detectar console.log, console.warn, console.debug
    const patterns = [
        /^\s*console\.(log|debug|info|warn)\([^)]*\);?\s*$/gm,
        /console\.(log|debug|info|warn)\([^)]*\);?/g
    ];

    patterns.forEach(pattern => {
        const newContent = content.replace(pattern, (match) => {
            // No eliminar console.error ni console.table (usado por LoggingService)
            if (match.includes('console.error') || match.includes('console.table')) {
                return match;
            }
            modified = true;
            return ''; // Eliminar la línea
        });
        content = newContent;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Optimized: ${path.relative(CONFIG.sourceDir, filePath)}`);
    }

    return modified;
}

/**
 * Procesa directorio recursivamente
 */
function processDirectory(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Verificar si debe excluirse
        const shouldExclude = CONFIG.excludePatterns.some(pattern =>
            pattern.test(filePath)
        );

        if (shouldExclude) return;

        if (stat.isDirectory()) {
            count += processDirectory(filePath);
        } else if (file.endsWith('.ts')) {
            if (removeConsoleLogs(filePath)) {
                count++;
            }
        }
    });

    return count;
}

// Ejecutar solo en build de producción
if (process.env.NODE_ENV === 'production' || process.argv.includes('--production')) {
    console.log('🚀 Build Optimizer - Removing console.logs from production build...\n');
    const count = processDirectory(CONFIG.sourceDir);
    console.log(`\n✅ Optimization complete! ${count} files processed.`);
} else {
    console.log('ℹ️  Build Optimizer skipped (not a production build)');
}
