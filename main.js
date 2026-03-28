const { app, BrowserWindow } = require("electron")
const path = require("path")
const { spawn } = require("child_process")

let mainWindow
let backendProcess
let frontendProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadURL("http://localhost:3000")

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  backendProcess = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, "backend"),
    stdio: "inherit",
    shell: true
  })

  frontendProcess = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname, "frontend"),
    stdio: "inherit",
    shell: true
  })

  setTimeout(() => {
    createWindow()
  }, 12000)
})

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill()
  if (frontendProcess) frontendProcess.kill()

  if (process.platform !== "darwin") {
    app.quit()
  }
})
