const fs = require('fs');
const path = require('path');

/**
 * Recursively counts files in a directory
 * @param {string} directoryPath - The path to the directory to count files in
 * @param {RegExp|string|Array} [exclude] - Regex pattern, string, or array of strings to exclude
 * @returns {Promise<number>} - The total number of files
 */
async function countFiles(directoryPath, exclude = null) {
    let fileCount = 0;

    try {
        const items = await fs.promises.readdir(directoryPath);

        for (const item of items) {
            const itemPath = path.join(directoryPath, item);
            
            // Skip excluded paths
            if (exclude) {
                // Handle RegExp
                if (exclude instanceof RegExp && exclude.test(item)) {
                    continue;
                }
                // Handle string
                else if (typeof exclude === 'string' && item === exclude) {
                    continue;
                }
                // Handle array of strings
                else if (Array.isArray(exclude) && exclude.includes(item)) {
                    continue;
                }
            }

            const stats = await fs.promises.stat(itemPath);

            if (stats.isFile()) {
                fileCount++;
            } else if (stats.isDirectory()) {
                fileCount += await countFiles(itemPath, exclude);
            }
        }

        return fileCount;
    } catch (error) {
        console.error(`Error counting files in ${directoryPath}:`, error);
        return fileCount;
    }
}

module.exports = countFiles;