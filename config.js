const config = {
    enableArch: false,
}

if (!config.enableArch) {
    document.getElementById("archB").remove()
}

console.log("Executed")
document.getElementById("archB").onclick = () => {
    console.log("Arch")
    if (config.enableArch) {
        window.electronAPI.arch()
    } else {
        alert("Arch is disabled")
    }
}