const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')
/**
 * Creates a folder if it does not exist.
 *
 * @param {string} path - The path of the folder to create
 * @returns {void}
 */
function createFolder(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
    }
}

/**
 * Creates a file if it does not exist.
 *
 * @param {string} path - The path of the file to create
 * @param {string} content - The content of the file to create
 * @returns {void}
 */

function copyFile(path, dist) {
    fs.copyFileSync(path, dist)
}

/**
 * When the app is ready, create a new browser window, load the index.html and
 * create the directories if they do not exist.
 */
app.on('ready', () => {
    /**
     * The preload script is loaded before the renderer (index.html) is loaded.
     * The preload script exposes an API in the "electronAPI" object that can be
     * accessed in the renderer.
     */
    const win = new BrowserWindow({ width: 800, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } })


    /**
     * The home directory is where the files will be downloaded.
     * Check if the directories exist, if not, create them.
     */
    const os = require('os')
    const homeDirectory = os.homedir()
    createFolder(path.join(homeDirectory, './eaglergrab'))
    createFolder(path.join(homeDirectory, './eaglergrab', 'versions'))
    copyFile(path.join(__dirname, 'binaries', "latest.html"), path.join(homeDirectory, './eaglergrab', 'versions', 'latest.html'))

    ipcMain.handle("start", () => {
        win.loadFile(path.join(homeDirectory, "./eaglergrab", "versions", "latest.html"))
    })

    win.on("close", (e) => {
        e.preventDefault()
        win.destroy()
    })
    
    

    win.loadFile('index.html')
})