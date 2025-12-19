import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'

export default function NewListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fruitType: '',
    quantity: '',
    description: '',
    address: '',
    city: '',
    state: '',
    availableStart: '',
    availableEnd: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to create a listing')
      return
    }

    setLoading(true)

    try {
      // Geocode the address using OpenStreetMap Nominatim (free, no API key needed)
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        `${formData.address}, ${formData.city}, ${formData.state}`
      )}`

      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'FruityApp/1.0',
        },
      })

      const geocodeData = await geocodeResponse.json()

      if (!geocodeData || geocodeData.length === 0) {
        toast.error('Could not find address. Please check and try again.')
        setLoading(false)
        return
      }

      const { lat, lon } = geocodeData[0]

      // Create listing
      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        fruit_type: formData.fruitType,
        quantity: formData.quantity,
        description: formData.description || null,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        city: formData.city,
        state: formData.state,
        full_address: `${formData.address}, ${formData.city}, ${formData.state}`,
        available_start: formData.availableStart,
        available_end: formData.availableEnd,
        status: 'active',
      })

      if (error) {
        toast.error('Failed to create listing')
        console.error(error)
      } else {
        toast.success('Listing created successfully!')
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error('Failed to create listing')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please sign in to create a listing</p>
          <Link
            to="/login"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl">🍊</span>
              <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-orange-600 font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Listing</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fruitType" className="block text-sm font-medium text-gray-700 mb-2">
                Fruit Type
              </label>
              <input
                id="fruitType"
                name="fruitType"
                type="text"
                placeholder="e.g., Oranges, Apples, Lemons"
                value={formData.fruitType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="text"
                placeholder="e.g., 50 lbs, A few bags, About 20 fruits"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Any additional details about the fruit..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="123 Main St"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="CA"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="availableStart" className="block text-sm font-medium text-gray-700 mb-2">
                  Available From
                </label>
                <input
                  id="availableStart"
                  name="availableStart"
                  type="date"
                  value={formData.availableStart}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="availableEnd" className="block text-sm font-medium text-gray-700 mb-2">
                  Available Until
                </label>
                <input
                  id="availableEnd"
                  name="availableEnd"
                  type="date"
                  value={formData.availableEnd}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
              <Link
                to="/dashboard"
                className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
