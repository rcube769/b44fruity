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
  if (!Number.isFinite(v)) v = 0.005

  // 2) Clamp to expected model output range (very small values)
  // Based on actual outputs: ~0 to ~0.01 (most outputs are 0.0002-0.01)
  v = clamp(v, 0, 0.01)
  console.log('[mapToBucket] After clamp, v =', v)

  // 3) Convert to a 0..1 "rottenness" score:
  // INVERTED: higher v => MORE ROTTEN, lower v => MORE FRESH
  const s = v / 0.01 // 0..1
  console.log('[mapToBucket] Rottenness score s =', s)

  // 4) INVERTED linear mapping to 2-14 days (wider range)
  // s = 0.0 → 14 days (most fresh, low raw output)
  // s = 1.0 → 2 days (most rotten, high raw output)
  const days = Math.round(14 - s * 12) // Maps 0..1 to 14..2 (INVERTED)

  // Determine stage based on days
  let stage
  if (days >= 9) {
    stage = 'Unripe'
  } else if (days >= 4) {
    stage = 'Ripe'
  } else {
    stage = 'Rotten'
  }

  console.log('[mapToBucket] Final days:', days, 'Stage:', stage)
  return { stage, days: clamp(days, 2, 14) }
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
          console.log('Clamped value:', clamp(Number(predValue), 0, 0.01))
          console.log('Rottenness score (s):', clamp(Number(predValue), 0, 0.01) / 0.01)
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
