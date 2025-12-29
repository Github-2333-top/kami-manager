import type { Response } from 'express'
import type { ApiResponse } from '../types/api.js'

/**
 * 发送成功响应
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = '操作成功',
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  }
  res.status(statusCode).json(response)
}

/**
 * 发送错误响应
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  details: any = null,
  statusCode: number = 400
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  }
  res.status(statusCode).json(response)
}

/**
 * 发送404错误
 */
export function sendNotFound(res: Response, message: string = '资源不存在'): void {
  sendError(res, 'NOT_FOUND', message, null, 404)
}

/**
 * 发送401未授权错误
 */
export function sendUnauthorized(res: Response, message: string = '未授权访问'): void {
  sendError(res, 'UNAUTHORIZED', message, null, 401)
}

/**
 * 发送403禁止访问错误
 */
export function sendForbidden(res: Response, message: string = '禁止访问'): void {
  sendError(res, 'FORBIDDEN', message, null, 403)
}

/**
 * 发送500服务器错误
 */
export function sendInternalError(res: Response, message: string = '服务器内部错误'): void {
  sendError(res, 'INTERNAL_ERROR', message, null, 500)
}

