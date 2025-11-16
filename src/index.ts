import express, { type Request } from 'express'
import cors from 'cors'
import { findWikiImage } from './wikiSearcher.js'
import { DEV } from './env.js'

const app = express()
app.use(cors())

app.get("/:query", (req, res) => {
    res.redirect(`/${req.params.query}/en`)
})

app.get("/:query/:lang", async (req, res) => {
    res.redirect(`/${req.params.query}/${req.params.lang}/none`)
})

app.get("/:query/:lang/:options", async (req, res) => {
    const url = await findWikiImage(req.params.query, req.params.lang)
    if (!DEV) {
        res.status(301)
    }

    if (req.params.options.includes('urlOnly')) {
        res.send(url)
        return
    }

    if (req.params.options.includes('stayOnSite')) {
        res.send(`<html>
            <head></head>
            <body>
                <img src="${url}">
            </body>
        </html>`)
        return
    }

    res.redirect(url)
})

app.use(/.+/, (req, res) => {
    res.redirect("/qasdhfalksdfknlqwer")
})

app.listen(4321, () => {
    console.log("Now listening")
})

