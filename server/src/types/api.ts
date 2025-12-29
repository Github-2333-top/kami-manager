// API请求和响应类型定义

import { Request, Response } from 'express'

// 扩展Express Request类型，添加认证信息
export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: string
    name: string
    platform: string | null
    rate_limit_per_minute: number
  }
}

// 统一响应格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

// 取卡操作请求
export interface WithdrawCardRequest {
  category_id: string
}

// 取卡操作响应
export interface WithdrawCardResponse {
  transaction_id: string
  cardsID: string
  code: string
  status: 'completed'
}

// 同步状态查询响应
export interface SyncStatusResponse {
  transaction_id: string
  status: 'pending' | 'completed' | 'failed'
  card_id: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

// Webhook订阅请求
export interface CreateWebhookRequest {
  callback_url: string
  events?: string[]
  secret_token?: string
}

// Webhook订阅响应
export interface WebhookSubscriptionResponse {
  id: string
  callback_url: string
  events: string[]
  is_active: boolean
  created_at: string
}

