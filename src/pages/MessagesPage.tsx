import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { PickupRequest, Message } from '../types'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchRequests()
  }, [user, navigate])

  useEffect(() => {
    if (selectedRequest) {
      fetchMessages(selectedRequest.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedRequest.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedRequest])

  const fetchRequests = async () => {
    if (!user) return

    try {
      // Fetch outgoing requests (requests I made)
      const { data: outgoing } = await supabase
        .from('pickup_requests')
        .select(`
          *,
          listing:listings(
            id,
            fruit_type,
            city,
            state,
            full_address
          )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch incoming requests (requests for my listings)
      const { data: incoming } = await supabase
        .from('pickup_requests')
        .select(`
          *,
          listing:listings!inner(
            id,
            fruit_type,
            city,
            state,
            full_address,
            user_id
          )
        `)
        .eq('listings.user_id', user.id)
        .order('created_at', { ascending: false })

      // Combine and sort by created_at
      const allRequests = [...(outgoing || []), ...(incoming || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setRequests(allRequests)
      if (allRequests.length > 0) {
        setSelectedRequest(allRequests[0])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            email
          )
        `)
        .eq('pickup_request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !newMessage.trim() || !user) return

    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        pickup_request_id: selectedRequest.id,
        sender_id: user.id,
        content: newMessage.trim(),
      })

      if (error) {
        toast.error('Failed to send message')
      } else {
        setNewMessage('')
        fetchMessages(selectedRequest.id)
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

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
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl text-gray-600 mb-4">No conversations yet</p>
            <p className="text-gray-500 mb-6">Request pickup from fruit listings to start chatting</p>
            <Link
              to="/map"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Browse Fruit Listings
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-lg">Conversations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {requests.map((req) => {
                  const listingData = req.listing
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedRequest?.id === req.id ? 'bg-orange-50 border-l-4 border-orange-600' : ''
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">{listingData?.fruit_type}</h3>
                      <p className="text-sm text-gray-600">
                        {listingData?.city}, {listingData?.state}
                      </p>
                      <span
                        className={`text-xs mt-1 inline-block px-2 py-1 rounded ${
                          req.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat Area */}
            {selectedRequest && selectedRequest.listing && (
              <div
                className="md:col-span-2 bg-white rounded-lg shadow-md flex flex-col"
                style={{ height: '600px' }}
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-bold text-lg">{selectedRequest.listing.fruit_type}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.listing.city}, {selectedRequest.listing.state}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex flex-col">
                        <div className="text-xs text-gray-500 mb-1">{msg.sender?.email}</div>
                        <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                          <p className="text-gray-900">{msg.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
