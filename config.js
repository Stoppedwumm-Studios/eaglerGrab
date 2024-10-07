const config = {
    enableArch: false,
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