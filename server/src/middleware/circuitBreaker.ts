import type { Request, Response, NextFunction } from 'express'

/**
 * 熔断器状态
 */
enum CircuitState {
  CLOSED = 'closed',    // 正常状态
  OPEN = 'open',        // 熔断状态
  HALF_OPEN = 'half_open' // 半开状态（尝试恢复）
}

interface CircuitBreakerOptions {
  failureThreshold: number      // 失败阈值（触发熔断的失败次数）
  resetTimeout: number          // 重置超时时间（毫秒）
  monitoringWindow: number      // 监控窗口时间（毫秒）
}

interface CircuitBreakerState {
  state: CircuitState
  failures: number
  lastFailureTime: number | null
  successCount: number
}

/**
 * 简单的熔断器实现
 */
class CircuitBreaker {
  private state: CircuitBreakerState
  private options: CircuitBreakerOptions

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 10,
      resetTimeout: options.resetTimeout || 30000, // 30秒
      monitoringWindow: options.monitoringWindow || 60000 // 1分钟
    }

    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      lastFailureTime: null,
      successCount: 0
    }
  }

  /**
   * 记录成功
   */
  recordSuccess(): void {
    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successCount++
      // 如果半开状态下连续成功3次，关闭熔断器
      if (this.state.successCount >= 3) {
        this.state.state = CircuitState.CLOSED
        this.state.failures = 0
        this.state.successCount = 0
        this.state.lastFailureTime = null
      }
    } else if (this.state.state === CircuitState.CLOSED) {
      // 正常状态下，重置失败计数
      this.state.failures = 0
    }
  }

  /**
   * 记录失败
   */
  recordFailure(): void {
    this.state.failures++
    this.state.lastFailureTime = Date.now()

    if (this.state.state === CircuitState.CLOSED) {
      // 如果失败次数超过阈值，打开熔断器
      if (this.state.failures >= this.options.failureThreshold) {
        this.state.state = CircuitState.OPEN
        console.warn('熔断器已打开，停止处理请求')
      }
    } else if (this.state.state === CircuitState.HALF_OPEN) {
      // 半开状态下失败，重新打开熔断器
      this.state.state = CircuitState.OPEN
      this.state.successCount = 0
    }
  }

  /**
   * 检查是否允许请求
   */
  isOpen(): boolean {
    // 如果熔断器是打开状态，检查是否应该进入半开状态
    if (this.state.state === CircuitState.OPEN) {
      if (this.state.lastFailureTime) {
        const timeSinceLastFailure = Date.now() - this.state.lastFailureTime
        if (timeSinceLastFailure >= this.options.resetTimeout) {
          // 进入半开状态，允许少量请求通过
          this.state.state = CircuitState.HALF_OPEN
          this.state.successCount = 0
          return false // 允许请求
        }
      }
      return true // 拒绝请求
    }

    return false // 允许请求
  }

  /**
   * 获取当前状态
   */
  getState(): CircuitState {
    return this.state.state
  }
}

// 为不同路径创建不同的熔断器
const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * 获取或创建熔断器
 */
function getCircuitBreaker(path: string): CircuitBreaker {
  if (!circuitBreakers.has(path)) {
    circuitBreakers.set(path, new CircuitBreaker({
      failureThreshold: 10,
      resetTimeout: 30000,
      monitoringWindow: 60000
    }))
  }
  return circuitBreakers.get(path)!
}

/**
 * 熔断器中间件
 */
export function circuitBreakerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const path = req.path
  const breaker = getCircuitBreaker(path)

  // 检查熔断器状态
  if (breaker.isOpen()) {
    res.status(503).json({
      success: false,
      error: {
        code: 'CIRCUIT_BREAKER_OPEN',
        message: '服务暂时不可用，请稍后重试'
      }
    })
    return
  }

  // 保存原始的send方法
  const originalSend = res.send.bind(res)

  // 拦截响应
  res.send = function (body: any) {
    // 根据状态码判断成功或失败
    if (res.statusCode >= 200 && res.statusCode < 400) {
      breaker.recordSuccess()
    } else if (res.statusCode >= 500) {
      breaker.recordFailure()
    }

    // 调用原始的send方法
    return originalSend(body)
  }

  // 处理错误
  const originalNext = next
  next = function (err?: any) {
    if (err) {
      breaker.recordFailure()
    }
    return originalNext(err)
  } as NextFunction

  next()
}

