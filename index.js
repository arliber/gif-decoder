const fs = require('fs');
const gifunct = require('gifuct-js')

const GIF_PATH = './gifs/wave.gif';
const GIF_SIZE = 320
const DESIRED_SIZE = 16

function intToHex(colorTable) {
    return (colorTableIndex) => {
        return '#' + Array.from(colorTable[colorTableIndex], byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
    }
}

fs.readFile(GIF_PATH, (err, data) => {
    if (err) {
        console.error('Error reading file', err);
        return;
    }

    const uint8Array = new Uint8Array(data);

    // Decode gif
    const gif = gifunct.parseGIF(uint8Array)
    const frames = gifunct.decompressFrames(gif, true)

    // Generate array of pixels, downsize to desired scale
    let prevFramePixels = []
    let minifiedFrames = []
    for (let frame of frames) {
        let currentFramePixels = frame.pixels
        if (prevFramePixels.length) {
            // Draw "patch" over previous frame
            let row = frame.dims.top
            let col = frame.dims.left
            let height = frame.dims.height
            let width = frame.dims.width
            let updatedFrame = [...prevFramePixels]
            for (let i = row, j=0; i < row + height; i++, j++) { // for every row in the frame
                const deleteCount = width;
                updatedFrame.splice(i * GIF_SIZE + col, deleteCount, ...currentFramePixels.slice(j*width, j*width+width))
            }

            // Reset transparent pixels to the value of the previous frame
            if (frame.transparentIndex) {
                updatedFrame = updatedFrame.map((colorIndex, pixelIndex) => colorIndex === frame.transparentIndex ? prevFramePixels[pixelIndex] : colorIndex )
            }

            // Set new frame
            currentFramePixels = updatedFrame

        }
        prevFramePixels = currentFramePixels

        const minifiedPixels = currentFramePixels.filter((_, index) => {
            const row = Math.floor(index / GIF_SIZE)
            const col = index % GIF_SIZE

            // Take the first pixel of every sliding window
            return row % (GIF_SIZE/DESIRED_SIZE) === 0 && col % (GIF_SIZE/DESIRED_SIZE) === 0
        })

        // Convert to color arrays
        minifiedFrames.push(minifiedPixels.map(intToHex(frame.colorTable)))
    }

    console.log(JSON.stringify(minifiedFrames))
});