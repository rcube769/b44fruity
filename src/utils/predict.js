import * as tf from '@tensorflow/tfjs'

let model = null

export async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel('/model.json')
  }
  return model
}

export async function predictExpirationDays(imageFile) {
  const model = await loadModel()

  const img = await createImageBitmap(imageFile)
  const canvas = document.createElement('canvas')
  canvas.width = 224
  canvas.height = 224
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, 224, 224)

  const tensor = tf.browser.fromPixels(canvas)
    .toFloat()
    .div(127.5)
    .sub(1)
    .expandDims(0)

  const prediction = model.predict(tensor)
  const days = (await prediction.data())[0]

  tensor.dispose()
  prediction.dispose()

  return Math.round(days)
}
