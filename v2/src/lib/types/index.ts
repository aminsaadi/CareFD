// Shared TypeScript types for CareFD v2
// These types are used across frontend and API routes

export interface User {
  user_id: string;
  user_number?: string;
  email: string;
  name: string;
  role: "patient" | "provider" | "admin";
  phone?: string;
  picture?: string;
  language_preference: string;
  is_verified: boolean;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  city?: string;
  address?: string;
  profile_image?: string;
  profile_color?: string;
  [key: string]: any;
}

export interface Provider {
  provider_id: string;
  provider_number: string;
  user_id: string;
  provider_type: "individual" | "company" | "clinic";
  business_name: string | null;
  description: string | null;
  about: string | null;
  profile_image: string | null;
  gender: string | null;
  profession_id: string | null;
  profession_name: string | null;
  specialization_id: string | null;
  specialization_name: string | null;
  expertise: string[];
  specializations: string[];
  profession_title: string | null;
  location: { address?: string; city?: string; country?: string; latitude?: number; longitude?: number };
  service_areas: string[];
  languages: string[];
  target_audience: string[];
  rating: number;
  total_reviews: number;
  subscription_tier: "free" | "pro" | "premium";
  is_verified: boolean;
  is_recommended: boolean;
  verification_status: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp_number: string | null;
  show_phone: boolean;
  show_email: boolean;
  show_whatsapp: boolean;
  years_experience: number | null;
  service_types: string[];
  views_count: number;
  health_funds: string[];
  payment_methods: string[];
  profile_color: string | null;
  created_at: string;
  distance_km?: number | null;
  // Detail view only
  services_list?: ServiceSummary[];
  availability?: Availability[];
  team_members?: TeamMember[];
  education?: any[];
  certifications?: any[];
}

export interface ServiceSummary {
  service_id: string;
  name: string;
  description?: string;
  price: number;
  pricing_type: string;
  service_category: string;
  delivery_types: string[];
  is_active: boolean;
}

export interface Service extends ServiceSummary {
  service_number: string;
  provider_id: string;
  currency: string;
  duration_minutes?: number;
  created_at: string;
  provider?: ProviderSummary;
}

export interface ProviderSummary {
  provider_id: string;
  business_name: string | null;
  rating: number;
  total_reviews: number;
  location?: { city?: string };
  phone?: string;
  gender?: string;
  languages?: string[];
  health_funds?: string[];
  is_verified: boolean;
  is_recommended: boolean;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  providerId: string;
  serviceId: string;
  bookingDate: string | null;
  bookingTime: string | null;
  status: BookingStatus;
  serviceName: string | null;
  serviceCategory: string | null;
  deliveryType: string | null;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  providerName: string | null;
  userName: string | null;
  basePrice: number | null;
  finalPrice: number | null;
  notes: string | null;
  createdAt: string;
}

export type BookingStatus =
  | "pending" | "confirmed" | "in_progress" | "provider_completed"
  | "completed" | "cancelled" | "cancellation_requested" | "rejected" | "on_hold";

export interface ServiceRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  urgency: "low" | "medium" | "high" | "urgent";
  professions: string[];
  budget?: number;
  offer_count: number;
  user_name?: string;
  user_picture?: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  requestId: string;
  providerId: string;
  price: number;
  pricingType: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired";
  providerName?: string;
  providerPicture?: string;
  createdAt: string;
}

export interface ChatRoom {
  room_id: string;
  user_id: string;
  provider_id: string;
  user_name: string;
  user_picture?: string;
  provider_name: string | null;
  provider_picture?: string;
  last_message?: string;
  last_message_at?: string;
  is_archived: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: string;
  content: string;
  messageType: "text" | "image" | "file";
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  notification_id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  is_read?: boolean;
  createdAt: string;
  created_at?: string;
  [key: string]: any;
}

export interface Review {
  id: string;
  userId: string;
  providerId: string;
  bookingId?: string;
  rating: number;
  comment: string;
  serviceQuality?: number;
  punctuality?: number;
  communication?: number;
  priceValue?: number;
  wouldRecommend: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  user?: { name: string; picture?: string };
}

export interface Profession {
  profession_id: string;
  name: string;
  name_en?: string;
  icon: string;
  specializations: string[];
  sub_professions: SubProfession[];
}

export interface SubProfession {
  sub_profession_id: string;
  name: string;
  name_en?: string;
  categories: { category_id: string; name: string; name_en?: string }[];
}

export interface Region {
  region_id: string;
  name: string;
  name_en?: string;
  cities: string[];
  lat?: number;
  lng?: number;
}

export interface Availability {
  day: string;
  shift: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
}

export interface TeamMember {
  member_id: string;
  name: string;
  role: string;
  specializations: string[];
  picture?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  skip: number;
  limit: number;
  [key: string]: T[] | number;
}
