import * as tf from '@tensorflow/tfjs'

let model = null

export async function loadModel() {
  if (!model) {
    console.log('Loading layers model from /model.json...')
    try {
      model = await tf.loadLayersModel('/model.json')
      console.log('Layers model loaded successfully:', model)
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

          const probs = prediction.dataSync() // softmax probabilities
          console.log('Probabilities:', probs)

          tensor.dispose()
          prediction.dispose()

          // Find best class + confidence
          let maxIdx = 0
          for (let i = 1; i < probs.length; i++) {
            if (probs[i] > probs[maxIdx]) maxIdx = i
          }

          const confidence = probs[maxIdx]
          console.log('Best class:', maxIdx, 'Confidence:', confidence)

          // Base day ranges per class
          const DAY_RANGES = {
            0: [6, 9],   // Unripe (fresh)
            1: [3, 5],   // Ripe
            2: [0, 2],   // Rotten
          }

          const [minDays, maxDays] = DAY_RANGES[maxIdx]

          // Interpolate days based on confidence
          const days = minDays + confidence * (maxDays - minDays)
          const roundedDays = Math.round(days)

          console.log('Raw days:', days)
          console.log('Rounded prediction:', roundedDays, 'days')
          console.log('Confidence:', Math.round(confidence * 100) + '%')
          console.log('Class:', maxIdx === 0 ? 'Unripe (fresh)' : maxIdx === 1 ? 'Ripe' : 'Rotten')

          resolve(roundedDays)
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
