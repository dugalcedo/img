import defaultImage from "./defaultImage.js"
import { devLog } from "./logger.js"
import { parse } from 'node-html-parser'

export const findWikiImage = async (query: string, lang: string): Promise<string> => {
    return await fromWikiPage(query, lang, 0)
}

const fromWikiPage = async (query: string, lang: string, attemptNumber: number): Promise<string> => {
    if (attemptNumber > 2) return defaultImage;

    try {
        const url  =`https://${lang}.wikipedia.org/wiki/${encodeURI(query)}`
        devLog({url})

        // Get res, and if not ok, try searching
        const res = await fetch(url)
        if (!res.ok) return await fromWikiSearch(query, lang, attemptNumber);

        const text = await res.text()
        const root = parse(text)

        // might be disambiguation page
        if (isDisambiguationPage(root as never as HTMLElement)) {
            return await fromDisambiguationPage(root as never as HTMLElement, query, lang, attemptNumber)
        }

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
        const url = `https://${lang}.wikipedia.org/w/index.php?search=${encodeURI(query)}`
        devLog({ url })

        // try to load img page
        const res = await fetch(url)
        if (!res.ok) return defaultImage


        const text = await res.text()
        const root = parse(text)

        const a = root.querySelector('.mw-search-result-heading a')
        if (!a) return findWikiImageSrcInDom(root as never as HTMLElement);
        const href = a.getAttribute('href');
        if (!href) return defaultImage;
        return await fromWikiPage(query, lang, attemptNumber+1);

    } catch (error) {
        devLog(`ERROR in fromWikiSearch(${query}, ${lang})`, error)
        return defaultImage
    }
}

const fromDisambiguationPage = async (root: HTMLElement, query: string, lang: string, attemptNumber: number): Promise<string> => {
    if (attemptNumber > 0) return defaultImage;

    try {
        const anchors = root.querySelectorAll('.mw-body-content li a[href^="/wiki/" i]')
        for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i]
            const href = a.getAttribute('href')
            if (!href) continue;
            if (href.includes(':')) continue;
            return await fromWikiPage(href.replace('/wiki/',''), lang, attemptNumber+1)
        }
        return defaultImage
    } catch (error) {
        devLog(`ERROR in fromDisambiguationPage(<root>, ${query}, ${lang})`, error)
        return defaultImage
    }
}

const findWikiImageSrcInDom = (root: HTMLElement): string => {
    const imgs = root.querySelectorAll(`img[src*="wikimedia"][src*="thumb"]`)
    for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i]
        const w = Number(img.getAttribute('width'))
        const h = Number(img.getAttribute('height'))
        const src = img.getAttribute('src')
        devLog({src, w, h})
        if (w < 101) continue;
        if (h < 101) continue;
        if (!src) continue;
        return `https:${src}`
    }
    return defaultImage
}

const isDisambiguationPage = (root: HTMLElement): boolean => {
    const a = root.querySelector('a[href="/wiki/Help:Disambiguation" i]')
    return !!a
}

