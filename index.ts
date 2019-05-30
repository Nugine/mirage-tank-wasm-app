import imageEncode from 'image-encode'
import { MirageTank } from 'mirage-tank-wasm-binding'
import { readFile } from './util'

main()

function main() {
    const foregroundInput = document.getElementById('foreground') as HTMLInputElement
    const foregroundLightInput = document.getElementById('foreground-light') as HTMLInputElement
    const foregroundColorInput = document.getElementById('foreground-color') as HTMLInputElement

    const backgroundInput = document.getElementById('background') as HTMLInputElement
    const backgroundLightInput = document.getElementById('background-light') as HTMLInputElement
    const backgroundColorInput = document.getElementById('background-color') as HTMLInputElement

    const widthInput = document.getElementById('width-input') as HTMLInputElement
    const heightInput = document.getElementById('height-input') as HTMLInputElement

    const checkerboardCheckbox = document.getElementById('is-checkerboarded') as HTMLInputElement
    const colorfulCheckbox = document.getElementById('is-colorful') as HTMLInputElement

    const renderBtn = document.getElementById('renderBtn') as HTMLButtonElement
    const lightBtn = document.getElementById('lightBtn') as HTMLButtonElement

    const foregroundImg = document.getElementById('foreground-image') as HTMLImageElement
    const backgroundImg = document.getElementById('background-image') as HTMLImageElement

    const outputImg = document.getElementById('output') as HTMLImageElement
    const downloadAnchor = document.getElementById('download') as HTMLAnchorElement


    const state: {
        wbuf: Uint8Array | undefined,
        bbuf: Uint8Array | undefined,
        light: boolean,
        mt: MirageTank | undefined
    } = { light: true, wbuf: undefined, bbuf: undefined, mt: undefined }

    const tie = (input: HTMLInputElement, img: HTMLImageElement, target: 'wbuf' | 'bbuf') => {
        input.onchange = async () => {
            if (!input.files || input.files.length < 1) {
                return
            }
            const file = input.files[0]
            img.src = URL.createObjectURL(file)
            const buf = new Uint8Array(await readFile(file))
            state[target] = buf

            if (state.mt) { state.mt.free(); state.mt = undefined }
            if (!state.wbuf || !state.bbuf) { return }
            state.mt = new MirageTank(state.wbuf, state.bbuf)
            widthInput.value = Math.min(state.mt.wimage_width, state.mt.bimage_width).toString()
            heightInput.value = Math.min(state.mt.wimage_height, state.mt.bimage_height).toString()
        }
    }

    const assertSize = (n: number) => { if (isNaN(n) || n <= 0 || n >= 10000) { throw "invalid size" } }

    const render = async () => {
        if (!state.wbuf || !state.bbuf) { throw "no input file" }
        if (!state.mt) { state.mt = new MirageTank(state.wbuf, state.bbuf) }

        const width = parseInt(widthInput.value, 10)
        const height = parseInt(heightInput.value, 10)
        assertSize(width), assertSize(height)
        const checkerboarded = checkerboardCheckbox.checked
        const isColorful = colorfulCheckbox.checked
        const wlight = parseFloat(foregroundLightInput.value)
        const blight = parseFloat(backgroundLightInput.value)
        const wcolor = parseFloat(foregroundColorInput.value)
        const bcolor = parseFloat(backgroundColorInput.value)

        let imageBuf
        if (isColorful) {
            imageBuf = state.mt.colorful_output(width, height, checkerboarded, wlight, blight, wcolor, bcolor)
        } else {
            imageBuf = state.mt.grey_output(width, height, checkerboarded, wlight, blight)
        }

        const data = imageEncode(imageBuf, 'png', { width, height })
        const urlBlob = URL.createObjectURL(new Blob([data]))

        outputImg.src = urlBlob
        downloadAnchor.href = urlBlob
    }

    tie(foregroundInput, foregroundImg, 'wbuf')
    tie(backgroundInput, backgroundImg, 'bbuf')

    renderBtn.onclick = async () => {
        console.log('rendering')
        try {
            await render()
            console.log('rendered')
        } catch (err) {
            console.log('aborted')
            console.error(err)
            alert(err);
        }
    }

    lightBtn.onclick = () => {
        state.light = !state.light
        if (state.light) {
            document.body.style.backgroundColor = null
            lightBtn.textContent = "关灯"
        } else {
            document.body.style.backgroundColor = "black"
            lightBtn.textContent = "开灯"
        }
    }

    colorfulCheckbox.onchange = () => {
        if (colorfulCheckbox.checked) {
            (foregroundColorInput.parentElement as HTMLDivElement).style.display = null;
            (backgroundColorInput.parentElement as HTMLDivElement).style.display = null;
        } else {
            (foregroundColorInput.parentElement as HTMLDivElement).style.display = "none";
            (backgroundColorInput.parentElement as HTMLDivElement).style.display = "none";
        }
    }

    console.log('loaded')
}
