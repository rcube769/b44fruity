import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Listing, PickupRequest } from '../types'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'listings' | 'requests'>('listings')
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myRequests, setMyRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (activeTab === 'listings') {
      fetchMyListings()
    } else {
      fetchMyRequests()
    }
  }, [user, activeTab, navigate])

  const fetchMyListings = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load listings')
    } else {
      setMyListings(data || [])
    }
    setLoading(false)
  }

  const fetchMyRequests = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listing:listings(
          id,
          fruit_type,
          quantity,
          city,
          state,
          full_address
        )
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load requests')
    } else {
      setMyRequests(data || [])
    }
    setLoading(false)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete listing')
    } else {
      toast.success('Listing deleted')
      fetchMyListings()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md',
      pending: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md',
      accepted: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
      completed: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md',
      declined: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
      cancelled: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md',
    }
    return (
      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-500 text-white'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">🍊</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Fruity</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/map" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                🗺️ Find Fruit
              </Link>
              <Link to="/messages" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                💬 Messages
              </Link>
              <Link
                to="/listings/new"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                ✨ New Listing
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, <span className="font-semibold text-orange-600">{user.email}</span>! 🎉</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all ${
                activeTab === 'listings'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              🌳 My Listings
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              📦 My Requests
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : activeTab === 'listings' ? (
          <div>
            {myListings.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div className="text-6xl mb-4">🌳</div>
                <p className="text-gray-600 text-lg mb-6">You haven't created any listings yet</p>
                <Link
                  to="/listings/new"
                  className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  🍊 Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <div key={listing.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-orange-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">🍊</span>
                        <h3 className="text-xl font-bold text-gray-900">{listing.fruit_type}</h3>
                      </div>
                      {getStatusBadge(listing.status)}
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-orange-600">📦 Quantity:</span> {listing.quantity}
                      </p>
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-orange-600">📅 Available:</span>
                        <span className="text-sm">{new Date(listing.available_start).toLocaleDateString()} - {new Date(listing.available_end).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      🗑️ Delete Listing
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {myRequests.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-600 text-lg mb-6">You haven't requested any fruit yet</p>
                <Link
                  to="/map"
                  className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  🌍 Find Fruit Near You
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 border-2 border-green-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🍊</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{request.listing?.fruit_type}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            📍 {request.listing?.city}, {request.listing?.state}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-green-600">📦 Quantity:</span> {request.listing?.quantity}
                      </p>
                      {request.message && (
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-green-600">💬 Message:</span>
                          <span className="italic">"{request.message}"</span>
                        </p>
                      )}
                    </div>
                    {request.status === 'accepted' && request.listing?.full_address && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md">
                        <p className="font-bold text-green-900 mb-2 flex items-center gap-2">
                          <span className="text-2xl">✅</span> Request Accepted!
                        </p>
                        <p className="text-sm text-green-800 flex items-center gap-2">
                          <strong>📍 Pickup Address:</strong> {request.listing.full_address}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                      🕒 Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
