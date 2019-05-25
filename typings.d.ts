declare module 'image-encode' {
    function encode(buf: ArrayBuffer, type: string, options: { width: number, height: number }): ArrayBuffer
    export default encode
}