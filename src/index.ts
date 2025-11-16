import express, { type Request } from 'express'
import cors from 'cors'
import { findWikiImage } from './wikiSearcher.js'

const app = express()
app.use(cors())

app.get("/:query", (req, res) => {
    res.redirect(`/${req.params.query}/en`)
})

app.get("/:query/:lang", async (req, res) => {
    const url = await findWikiImage(req.params.query, req.params.lang)

    if (typeof req.query.urlOnly === 'string') {
        res.send(url)
        return
    }

    res.redirect(url)
})

app.use(/.+/, (req, res) => {
    res.redirect("/wallace shawn")
})

app.listen(4321, () => {
    console.log("Now listening")
})

