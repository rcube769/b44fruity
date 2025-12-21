import * as tf from '@tensorflow/tfjs'

let model = null

export async function loadModel() {
  if (!model) {
    console.log('Loading graph model from /model.json...')
    try {
      model = await tf.loadGraphModel('/model.json')
      console.log('Graph model loaded successfully:', model)
    } catch (error) {
      console.error('Error loading model:', error)
      throw error
    }
  }
  return model
}

export async function predictExpirationDays(imageFile) {
  try {
    console.log('Starting prediction for image:', imageFile.name)
    const model = await loadModel()
    console.log('Model loaded for prediction')

    const img = new Image()
    img.src = URL.createObjectURL(imageFile)

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          console.log('Image loaded:', img.width, 'x', img.height)

          const tensor = tf.browser.fromPixels(img)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .div(127.5)
            .sub(1)
            .expandDims(0)
          console.log('Tensor created with shape:', tensor.shape)

          const prediction = model.predict(tensor)
          console.log('Prediction made:', prediction)

          const raw = prediction.dataSync()[0]
          console.log("RAW MODEL OUTPUT:", raw)

          tensor.dispose()
          prediction.dispose()

          // ---- Sigmoid calibration (robust to tiny outputs) ----
          const MID = 0.01        // center of expected raw outputs
          const STEEPNESS = 120   // controls spread
          const MIN_DAYS = 2
          const MAX_DAYS = 21

          // Sigmoid mapping
          const sigmoid = 1 / (1 + Math.exp(-STEEPNESS * (raw - MID)))

          // Map to days
          const days = Math.round(
            MIN_DAYS + sigmoid * (MAX_DAYS - MIN_DAYS)
          )

          console.log({ raw, sigmoid, days })

          resolve(days)
        } catch (error) {
          console.error('Prediction error:', error)
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    })
  } catch (error) {
    console.error('Detailed prediction error:', error)
    throw error
  }
}
