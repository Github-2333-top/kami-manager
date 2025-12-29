// 数据库表类型定义

export interface Category {
  id: string
  name: string
  color: string
  created_at: Date
}

export interface Card {
  id: string
  code: string
  category_id: string | null
  remark: string | null
  used_by: string | null
  is_used: boolean
  created_at: Date
  updated_at: Date
}

export interface Settings {
  id: string
  announcement: string | null
  updated_at: Date
}

export interface ApiKey {
  id: string
  key_hash: string
  name: string
  platform: string | null
  is_active: boolean
  rate_limit_per_minute: number
  created_at: Date
  last_used_at: Date | null
}

export interface Transaction {
  id: string
  api_key_id: string | null
  category_id: string | null
  card_id: string | null
  status: 'pending' | 'completed' | 'failed'
  error_message: string | null
  created_at: Date
  completed_at: Date | null
}

export interface WebhookSubscription {
  id: string
  api_key_id: string
  callback_url: string
  events: string[] | null
  is_active: boolean
  secret_token: string | null
  created_at: Date
}

export interface WebhookDelivery {
  id: string
  subscription_id: string
  transaction_id: string | null
  status: 'pending' | 'success' | 'failed'
  response_code: number | null
  response_body: string | null
  attempts: number
  created_at: Date
  delivered_at: Date | null
}

