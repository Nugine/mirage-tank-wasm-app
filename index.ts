import imageEncode from 'image-encode'
import { MirageTank } from 'mirage-tank-wasm-binding'
import { readFile } from './util'

main()

function main() {
    const foregroundInput = document.getElementById('foreground') as HTMLInputElement
    const foregroundImg = document.getElementById('foreground-image') as HTMLImageElement
    const backgroundInput = document.getElementById('background') as HTMLInputElement
    const backgroundImg = document.getElementById('background-image') as HTMLImageElement
    const outputImg = document.getElementById('output') as HTMLImageElement
    const renderBtn = document.getElementById('renderBtn') as HTMLButtonElement
    const downloadAnchor = document.getElementById('download') as HTMLAnchorElement
    const widthInput = document.getElementById('width-input') as HTMLInputElement
    const heightInput = document.getElementById('height-input') as HTMLInputElement
    const checkerboardCheckbox = document.getElementById('is-checkerboarded') as HTMLInputElement
    const colorfulCheckbox = document.getElementById('is-colorful') as HTMLInputElement

    const cache: { wbuf: Uint8Array | undefined, bbuf: Uint8Array | undefined } = {} as any
    let mt: MirageTank | undefined

    const tie = (input: HTMLInputElement, img: HTMLImageElement, target: 'wbuf' | 'bbuf') => {
        input.onchange = async () => {
            if (!input.files || input.files.length < 1) {
                return
            }
            const file = input.files[0]
            img.src = URL.createObjectURL(file)
            const buf = new Uint8Array(await readFile(file))
            cache[target] = buf

            if (mt) { mt.free(); mt = undefined }
            if (!cache.wbuf || !cache.bbuf) { return }
            mt = new MirageTank(cache.wbuf, cache.bbuf)
            widthInput.value = Math.min(mt.wimage_width, mt.bimage_width).toString()
            heightInput.value = Math.min(mt.wimage_height, mt.bimage_height).toString()
        }
    }

    const render = async () => {
        if (!mt) { return }

        const width = parseInt(widthInput.value, 10)
        const height = parseInt(heightInput.value, 10)
        const checkerboarded = checkerboardCheckbox.checked
        const isColorful = colorfulCheckbox.checked
        const wlight = 1.0
        const blight = 0.2
        const wcolor = 0.5
        const bcolor = 0.7

        let imageBuf
        if (isColorful) {
            imageBuf = mt.colorful_output(width, height, checkerboarded, wlight, blight, wcolor, bcolor)
        } else {
            imageBuf = mt.grey_output(width, height, checkerboarded, wlight, blight)
        }

        const data = imageEncode(imageBuf, 'png', { width, height })
        const urlBlob = URL.createObjectURL(new Blob([data]))

        outputImg.src = urlBlob
        outputImg.width = width
        outputImg.height = height
        downloadAnchor.href = urlBlob
    }

    widthInput.value = '300'
    heightInput.value = '300'
    tie(foregroundInput, foregroundImg, 'wbuf')
    tie(backgroundInput, backgroundImg, 'bbuf')

    renderBtn.onclick = async () => {
        console.log('rendering')
        await render()
        console.log('rendered')
    }

    console.log('loaded')
}
