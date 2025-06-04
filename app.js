const express = require('express')
const app = express()
const port = 3000
const routersRouter = require('./routes/routers.js')

app.use(express.json())

app.use ('/routers', routersRouter)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})