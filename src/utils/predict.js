import * as tf from '@tensorflow/tfjs'

let _modelPromise = null

async function getModel() {
  if (!_modelPromise) {
    console.log('Loading graph model from /model.json...')
    _modelPromise = tf.loadGraphModel('/model.json')
  }
  return _modelPromise
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x))
}

// Turn the model's continuous output into 3 classes + exact days.
// We don't assume your model is perfect; we normalize safely.
function mapToBucket(predValue) {
  // 1) Make prediction safe (handle NaN/inf/neg/huge)
  let v = Number(predValue)
  if (!Number.isFinite(v)) v = 7

  // 2) Clamp to a reasonable shelf-life window
  // (adjust if you want; this is just to stabilize)
  v = clamp(v, 0, 20)

  // 3) Convert to a 0..1 "freshness-ish" score:
  // higher v => "more days left" => more unripe
  const s = v / 20 // 0..1

  // 4) Bucket + exact day mapping
  if (s >= 0.60) {
    // UNRIPE: exact values 9,10,11,12
    // map s 0.60..1.00 -> 9..12
    const t = (s - 0.60) / 0.40 // 0..1
    const days = 9 + Math.round(t * 3) // 9..12
    return { stage: 'Unripe', days: clamp(days, 9, 12) }
  } else if (s >= 0.30) {
    // RIPE: exact values 5..9
    // map s 0.30..0.60 -> 5..9
    const t = (s - 0.30) / 0.30 // 0..1
    const days = 5 + Math.round(t * 4) // 5..9
    return { stage: 'Ripe', days: clamp(days, 5, 9) }
  } else {
    // ROTTEN: exact values 1..3
    // map s 0.00..0.30 -> 1..3
    const t = s / 0.30 // 0..1
    const days = 1 + Math.round(t * 2) // 1..3
    return { stage: 'Rotten', days: clamp(days, 1, 3) }
  }
}

export async function predictExpirationDays(imageFile) {
  try {
    console.log('Starting prediction for image:', imageFile.name)
    const model = await getModel()
    console.log('Model loaded for prediction')

    const img = new Image()
    img.src = URL.createObjectURL(imageFile)

    return new Promise((resolve, reject) => {
      img.onerror = () => reject(new Error('Could not load image'))
      img.onload = () => {
        try {
          const x = tf.tidy(() => {
            // Match MobileNetV2 preprocessing: [-1, 1]
            return tf.browser
              .fromPixels(img)
              .resizeNearestNeighbor([224, 224])
              .toFloat()
              .div(127.5)
              .sub(1)
              .expandDims(0)
          })

          const y = model.predict(x)
          const predValue = y.dataSync()[0]

          x.dispose()
          if (y.dispose) y.dispose()

          const result = mapToBucket(predValue)
          console.log('===== PREDICTION DEBUG =====')
          console.log('RAW MODEL OUTPUT:', predValue)
          console.log('Normalized value (v):', Number(predValue))
          console.log('Clamped value:', clamp(Number(predValue), 0, 20))
          console.log('Freshness score (s):', clamp(Number(predValue), 0, 20) / 20)
          console.log('Stage:', result.stage)
          console.log('Days:', result.days)
          console.log('============================')

          // Return just the days for backward compatibility
          resolve(result.days)
        } catch (e) {
          reject(e)
        }
      }
    })
  } catch (error) {
    console.error('Detailed prediction error:', error)
    throw error
  }
}
