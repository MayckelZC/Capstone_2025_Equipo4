/**
 * Configuración de Terser para Angular
 * Elimina console.log en producción
 */
module.exports = {
    compress: {
        pure_funcs: [
            'console.log',
            'console.debug',
            'console.info',
            'console.warn'
        ],
        drop_console: false, // No eliminar console.error
        drop_debugger: true,
        passes: 2
    },
    mangle: {
        safari10: true
    },
    format: {
        comments: false
    }
};
