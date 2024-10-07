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
 * Copies a file from one location to another.
 *
 * @param {string} path - The path to the source file
 * @param {string} dist - The path to the destination file
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
    let win = new BrowserWindow({ width: 800, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } })
    let erun = false


    /**
     * The home directory is where the files will be downloaded.
     * Check if the directories exist, if not, create them.
     */
    const os = require('os')
    const homeDirectory = os.homedir()
    createFolder(path.join(homeDirectory, './eaglergrab'))
    createFolder(path.join(homeDirectory, './eaglergrab', 'versions'))
    copyFile(path.join(__dirname, 'binaries', "latest.html"), path.join(homeDirectory, './eaglergrab', 'versions', 'latest.html'))
    copyFile(path.join(__dirname, 'binaries', "dev.html"), path.join(homeDirectory, './eaglergrab', 'versions', 'dev.html'))
    copyFile(path.join(__dirname, 'binaries', "arch.html"), path.join(homeDirectory, './eaglergrab', 'versions', 'arch.html'))

    ipcMain.handle("start", () => {
        win.loadFile(path.join(homeDirectory, "./eaglergrab", "versions", "latest.html"))
        erun = true
        win.on("close", (e) => {
            e.preventDefault()
            let copy = win
            win = new BrowserWindow({ width: 800, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } })
            copy.destroy()
            win.loadFile("index.html")
        })
    })
    
    ipcMain.handle("devbuild", () => {
        win.loadFile(path.join(homeDirectory, "./eaglergrab", "versions", "dev.html"))
        erun = true
        win.on("close", (e) => {
            e.preventDefault()
            let copy = win
            win = new BrowserWindow({ width: 800, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } })
            copy.destroy()
            win.loadFile("index.html")
        })
    })
    
    ipcMain.handle("arch", () => {
        win.loadFile(path.join(homeDirectory, "./eaglergrab", "versions", "arch.html"))
        erun = true
        win.on("close", (e) => {
            e.preventDefault()
            let copy = win
            win = new BrowserWindow({ width: 800, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } })
            copy.destroy()
            win.loadFile("index.html")
        })
    })

    win.loadFile('index.html')
})