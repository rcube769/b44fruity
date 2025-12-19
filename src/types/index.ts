export interface User {
  id: string
  email: string
  display_name?: string
  created_at?: string
}

export interface Listing {
  id: string
  user_id: string
  fruit_type: string
  quantity: string
  description?: string
  latitude: number
  longitude: number
  city: string
  state: string
  full_address?: string
  available_start: string
  available_end: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

export interface PickupRequest {
  id: string
  listing_id: string
  requester_id: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  message?: string
  created_at: string
  listing?: Listing
  requester?: User
}

export interface Message {
  id: string
  pickup_request_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
}
