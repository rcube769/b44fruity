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

    const img = await createImageBitmap(imageFile)
    console.log('Image bitmap created:', img.width, 'x', img.height)

    const canvas = document.createElement('canvas')
    canvas.width = 224
    canvas.height = 224
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, 224, 224)
    console.log('Image drawn to canvas')

    const tensor = tf.browser.fromPixels(canvas)
      .toFloat()
      .div(127.5)
      .sub(1)
      .expandDims(0)
    console.log('Tensor created with shape:', tensor.shape)

    const prediction = model.predict(tensor)
    console.log('Prediction made:', prediction)

    const days = (await prediction.data())[0]
    console.log('Raw prediction value:', days)

    tensor.dispose()
    prediction.dispose()

    const rounded = Math.round(days)
    console.log('Rounded prediction:', rounded, 'days')
    return rounded
  } catch (error) {
    console.error('Detailed prediction error:', error)
    throw error
  }
}
