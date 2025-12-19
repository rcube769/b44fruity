import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Listing } from '../types'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function MapPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7749, -122.4194]) // Default to SF

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Keep default location
        }
      )
    }

    fetchListings()
  }, [])

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load listings')
      console.error(error)
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }

  const requestPickup = async (listingId: string) => {
    if (!user) {
      toast.error('Please sign in to request pickup')
      return
    }

    const message = prompt('Add a message to the fruit owner (optional):')
    if (message === null) return // User cancelled

    try {
      const { error } = await supabase
        .from('pickup_requests')
        .insert({
          listing_id: listingId,
          requester_id: user.id,
          message: message || null,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a request for this listing')
        } else {
          toast.error('Failed to send request')
        }
      } else {
        toast.success('Pickup request sent! Check Messages for updates.')
        setSelectedListing(null)
      }
    } catch (error) {
      toast.error('Failed to send request')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl">🍊</span>
              <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
            </Link>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-700 hover:text-orange-600 font-medium">
                    Dashboard
                  </Link>
                  <Link to="/messages" className="text-gray-700 hover:text-orange-600 font-medium">
                    Messages
                  </Link>
                </>
              ) : (
                <Link to="/login" className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {listings.map((listing) => (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                eventHandlers={{
                  click: () => setSelectedListing(listing),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{listing.fruit_type}</h3>
                    <p className="text-sm text-gray-600">{listing.quantity}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {listing.city}, {listing.state}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Listing Detail Modal */}
        {selectedListing && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl p-6 w-96 max-w-[90vw] z-[1000]">
            <button
              onClick={() => setSelectedListing(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
            <div className="text-4xl mb-2">🍊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedListing.fruit_type}</h3>
            <p className="text-gray-600 mb-2">
              <strong>Quantity:</strong> {selectedListing.quantity}
            </p>
            {selectedListing.description && (
              <p className="text-gray-600 mb-2">{selectedListing.description}</p>
            )}
            <p className="text-gray-600 mb-2">
              <strong>Location:</strong> {selectedListing.city}, {selectedListing.state}
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Available:</strong> {new Date(selectedListing.available_start).toLocaleDateString()} -{' '}
              {new Date(selectedListing.available_end).toLocaleDateString()}
            </p>
            {user ? (
              selectedListing.user_id === user.id ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  This is your listing
                </div>
              ) : (
                <button
                  onClick={() => requestPickup(selectedListing.id)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Request Pickup
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Sign In to Request
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
