import defaultImage from "./defaultImage.js"
import { devLog } from "./logger.js"
import { parse } from 'node-html-parser'

export const findWikiImage = async (query: string, lang: string): Promise<string> => {
    return await fromWikiPage(query, lang, 0)
}

const fromWikiPage = async (query: string, lang: string, attemptNumber: number): Promise<string> => {
    if (attemptNumber > 1) return defaultImage;

    try {
        const url  =`https://${lang}.wikipedia.org/wiki/${encodeURI(query)}`
        devLog({url})

        // Get res, and if not ok, try searching
        const res = await fetch(url)
        if (!res.ok) return await fromWikiSearch(query, lang, attemptNumber);

        const text = await res.text()
        const root = parse(text)

        // Try to find image
        const imgSrc = findWikiImageSrcInDom(root as unknown as HTMLElement)
        return imgSrc


    } catch (error) {
        devLog(`ERROR in fromWikiPage(${query}, ${lang})`, error)
        return defaultImage
    }
}

const fromWikiSearch = async (query: string, lang: string, attemptNumber: number): Promise<string> => {
    if (attemptNumber > 0) return defaultImage;

    try {
        // try to load img page
        const res = await fetch(`https://${lang}.wikipedia.org/w/index.php?search=${encodeURI(query)}`)
        if (!res.ok) return defaultImage

        const text = await res.text()
        const root = parse(text)
        const a = root.querySelector('.mw-search-result-heading a')
        if (!a) return defaultImage;
        const href = a.getAttribute('href');
        if (!href) return defaultImage;
        return await fromWikiPage(query, lang, attemptNumber+1);

    } catch (error) {
        devLog(`ERROR in fromWikiSearch(${query}, ${lang})`, error)
        return defaultImage
    }
}

const disallowedHeights = []
for (let i = 5; i < 51; i++) {disallowedHeights.push(i)}
const notRules = disallowedHeights.map(h => `:not([height=${h}]):not([width=${h}])`).join('')

const findWikiImageSrcInDom = (root: HTMLElement): string => {
    const img = (
        root.querySelector(`img[src*="wikimedia" i][src*="thumb" i]:not([alt*="Featured article" i]):not([alt*="Page semi-protected" i]):not([alt*="Listen to this article" i]):not([src*=".svg"])${notRules}`)
    )
    if (!img) return defaultImage
    const src = img.getAttribute('src')
    if (!src) return defaultImage
    return src
}