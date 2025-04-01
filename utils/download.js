#!/usr/bin/env node
"use strict";

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises'); // For easier stream error handling

// --- Configuration ---
// !! IMPORTANT: Replace these with the actual values for the file you want !!
const CONFIG = {
    ipfsCID: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", // Example CID (replace!)
    ipfsPath: "index.html",                  // Example Path (replace! or use "" if none)
    isGzipped: false,                        // Set to true if the file is gzipped (replace!)
    expectedSize: 10,                    // Approx size in bytes for progress (optional, replace!)
    outputFilePath: "./downloaded_client.js", // Desired output path (replace!)
    gateways: [                              // Same gateway logic as browser script
        makePatternA("gateway.ipfs.io"),
        makePatternB("4everland.io"),
        makePatternB("dweb.link"),
        makePatternA("cloudflare-ipfs.com"),
        makePatternB("cf-ipfs.com"),
        makePatternA("w3s.link"),
        makePatternA("storry.tv"),
        makePatternB("nftstorage.link")
    ],
    retryDelayMs: 100 // Delay between trying different gateways
};
// --- End Configuration ---

// --- Helper Functions ---

// Keep the same gateway URL generation functions
function makePatternA(domain) {
    const domainStr = domain;
    return (cid, path) => `https://${domainStr}/ipfs/${cid}${path ? '/' + path : ''}`;
}

function makePatternB(domain) {
    const domainStr = domain;
    return (cid, path) => `https://${cid}.ipfs.${domainStr}${path ? '/' + path : ''}`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Downloads a file from a given URL to a temporary path, showing progress.
 * Returns the path to the downloaded file on success, null on failure.
 */
function downloadFile(url, tempOutputPath, expectedSize) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(tempOutputPath);
        let receivedBytes = 0;

        console.log(`Attempting download from: ${url}`);

        const request = https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed: Status Code ${response.statusCode} from ${url}`));
                // Consume response data to free up memory
                response.resume();
                return;
            }

            const totalBytes = parseInt(response.headers['content-length'] || expectedSize || "0", 10);
            console.log(`Downloading to ${tempOutputPath}... (Size: ${totalBytes > 0 ? (totalBytes / 1024).toFixed(1) + ' KB' : 'Unknown'})`);

            response.on('data', (chunk) => {
                receivedBytes += chunk.length;
                if (totalBytes > 0) {
                    const percent = ((receivedBytes / totalBytes) * 100).toFixed(1);
                    process.stdout.write(`Progress: ${percent}% (${(receivedBytes / 1024).toFixed(1)} KB / ${(totalBytes / 1024).toFixed(1)} KB)\r`);
                } else {
                    process.stdout.write(`Progress: ${(receivedBytes / 1024).toFixed(1)} KB\r`);
                }
            });

            // Use pipeline for robust stream handling and error forwarding
            pipeline(response, fileStream)
                .then(() => {
                    process.stdout.write('\n'); // New line after progress
                    console.log(`Downloaded successfully to ${tempOutputPath}`);
                    resolve(tempOutputPath);
                })
                .catch((err) => {
                    process.stdout.write('\n');
                    console.error(`Stream pipeline error during download from ${url}:`, err.message);
                    // Attempt to clean up partial file
                    fs.unlink(tempOutputPath, () => {});
                    reject(err);
                });
        });

        request.on('error', (err) => {
            console.error(`Request error downloading from ${url}:`, err.message);
             // Attempt to clean up partial file
             fs.unlink(tempOutputPath, () => {});
            reject(err);
        });

        // Handle timeouts (e.g., 30 seconds)
        request.setTimeout(30000, () => {
             console.error(`Request timed out: ${url}`);
             request.destroy(new Error('Request timed out')); // This will trigger the 'error' event above
        });
    });
}

/**
 * Decompresses a gzipped file.
 */
async function decompressFile(inputPath, outputPath) {
    console.log(`Decompressing ${inputPath} to ${outputPath}...`);
    const gunzip = zlib.createGunzip();
    const source = fs.createReadStream(inputPath);
    const destination = fs.createWriteStream(outputPath);

    try {
        await pipeline(source, gunzip, destination);
        console.log(`Decompressed successfully.`);
        // Clean up the compressed file
        await fs.promises.unlink(inputPath);
        console.log(`Removed temporary file: ${inputPath}`);
        return true;
    } catch (err) {
        console.error(`Decompression failed:`, err);
        // Attempt cleanup on error
        await fs.promises.unlink(inputPath).catch(() => {}); // Try removing gz
        await fs.promises.unlink(outputPath).catch(() => {}); // Try removing partial output
        return false;
    }
}

// --- Main Execution Logic ---

async function main() {
    while (true) {
        const {
            ipfsCID,
            ipfsPath,
            isGzipped,
            expectedSize,
            outputFilePath,
            gateways,
            retryDelayMs
        } = CONFIG;
    
        if (!ipfsCID) {
            console.error("Error: IPFS CID is not configured.");
            process.exit(1);
        }
        if (!outputFilePath) {
            console.error("Error: Output file path is not configured.");
            process.exit(1);
        }
    
        // Ensure output directory exists
        const outputDir = path.dirname(outputFilePath);
        try {
            await fs.promises.mkdir(outputDir, { recursive: true });
        } catch (err) {
            console.error(`Error creating output directory '${outputDir}':`, err);
            process.exit(1);
        }
    
    
        const tempDownloadPath = outputFilePath + ".download"; // Temp path during download
        const tempGzipPath = outputFilePath + ".gz.tmp"; // Temp path if gzipped
    
        const gatewayFunctions = [...gateways]; // Create a mutable copy
        // Randomize starting gateway
        const startIndex = Math.floor(Math.random() * gatewayFunctions.length);
    
        let downloaded = false;
    
        for (let i = 0; i < gatewayFunctions.length; ++i) {
            const currentIndex = (startIndex + i) % gatewayFunctions.length;
            const gatewayFn = gatewayFunctions[currentIndex];
            const url = gatewayFn(ipfsCID, ipfsPath);
    
            // Determine temporary path based on whether decompression is needed later
            const currentTempPath = isGzipped ? tempGzipPath : tempDownloadPath;
    
            try {
                // Attempt download
                await downloadFile(url, currentTempPath, expectedSize);
    
                // If gzipped, decompress now
                if (isGzipped) {
                    const success = await decompressFile(currentTempPath, outputFilePath); // Decompress to final path
                    if (!success) {
                        throw new Error(`Decompression failed for ${currentTempPath}`);
                    }
                } else {
                    // If not gzipped, rename the temp file to the final path
                    await fs.promises.rename(currentTempPath, outputFilePath);
                    console.log(`File saved to ${outputFilePath}`);
                }
    
                console.log("✅ Download and processing complete!");
                downloaded = true;
                break; // Exit loop on success
    
            } catch (error) {
                console.error(`Attempt failed: ${error.message}`);
                // Clean up any temporary file from this failed attempt
                await fs.promises.unlink(currentTempPath).catch(() => {});
                if (i < gatewayFunctions.length - 1) {
                    console.log(`Retrying with another gateway in ${retryDelayMs / 1000}s...`);
                    await delay(retryDelayMs);
                }
            }
        }
    
        if (!downloaded) {
            console.log("Trying again")
        } else {
            break
        }
    }
}


// --- Run ---
main().catch((err) => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
});
