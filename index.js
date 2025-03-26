const app = require("express")()

app.get("/", (req, res) => {
    res.send("Hello " + req.headers["user-agent"])
})

app.listen(3000)