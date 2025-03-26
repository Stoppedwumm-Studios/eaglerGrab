const config = {
    enableArch: true,
}

if (!config.enableArch) {
    document.getElementById("archB").remove()
}

console.log("Executed")
    /**
     * Arch button click handler.
     * If config.enableArch is true, opens the arch Eaglercraft client.
     * If config.enableArch is false, shows an alert dialog saying "Arch is disabled"
     */
document.getElementById("archB").onclick = () => {
    console.log("Arch")
    if (config.enableArch) {
        window.eaglerGrabAPI.arch()
    } else {
        alert("Arch is disabled")
    }
}
