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
          console.log('Raw model output:', raw)

          tensor.dispose()
          prediction.dispose()

          // Scale raw output by 3 and clamp between 1 and 30 days
          const days = Math.min(30, Math.max(1, Math.round(raw * 3)))

          console.log('Predicted days:', days)

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
