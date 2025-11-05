import { Injectable, Logger } from '@nestjs/common'
import { Response } from 'express'

export interface SSEMessage {
  event: string
  data: any
}

/**
 * Service to manage the SSE connections
 */
@Injectable()
export class SSEService {
  private readonly logger = new Logger(SSEService.name)
  // Track active SSE connections by sessionId
  private readonly activeConnections: Map<string, Response> = new Map()

  setupConnection(res: Response, sessionId: string): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

    // Track active connection
    this.activeConnections.set(sessionId, res)

    // Handle client disconnect
    res.on('close', () => {
      this.activeConnections.delete(sessionId)
    })

    // Handle errors on response stream (prevents unhandled error events)
    res.on('error', () => {
      this.activeConnections.delete(sessionId)
    })

    // Send initial connection confirmation
    this.sendEvent(res, 'connected', { sessionId })
  }

  /**
   * Send a chunk of text to the client
   */
  sendChunk(res: Response, chunk: { text: string; tokens?: number }): void {
    if (this.isConnectionClosed(res)) {
      return
    }

    this.sendEvent(res, 'chunk', {
      text: chunk.text,
      tokens: chunk.tokens,
    })
  }

  /**
   * Send metadata to the client
   */
  sendMetadata(res: Response, metadata: any): void {
    if (this.isConnectionClosed(res)) {
      return
    }

    this.sendEvent(res, 'metadata', metadata)
  }

  /**
   * Send done event to the client
   */
  sendDone(res: Response, data: any, sessionId?: string): void {
    if (this.isConnectionClosed(res)) {
      if (sessionId) {
        this.activeConnections.delete(sessionId)
      }
      return
    }

    try {
      this.sendEvent(res, 'done', data)
    } finally {
      this.closeConnection(res, sessionId)
    }
  }

  /**
   * Send error event to the client
   */
  sendError(res: Response, error: Error | string, sessionId?: string): void {
    if (this.isConnectionClosed(res)) {
      if (sessionId) {
        this.activeConnections.delete(sessionId)
      }
      return
    }

    try {
      const errorMessage = error instanceof Error ? error.message : error
      this.sendEvent(res, 'error', {
        code: 'ERROR',
        message: errorMessage,
      })
    } finally {
      this.closeConnection(res, sessionId)
    }
  }

  /**
   * Send cancellation event and close connection
   */
  sendCancelled(res: Response, sessionId: string): void {
    if (this.isConnectionClosed(res)) {
      this.activeConnections.delete(sessionId)
      return
    }

    try {
      this.sendEvent(res, 'cancelled', {
        sessionId,
        message: 'Session cancelled by user',
      })
    } finally {
      this.closeConnection(res, sessionId)
    }
  }

  /**
   * Close active SSE connection for a session
   * Called when session is cancelled
   * Returns true if connection was closed, false if already closed or not found
   */
  closeSession(sessionId: string): boolean {
    const res = this.activeConnections.get(sessionId)
    if (!res) {
      return false // No active connection
    }

    if (this.isConnectionClosed(res)) {
      // Already closed, just remove from tracking
      this.activeConnections.delete(sessionId)
      return false
    }

    try {
      this.sendCancelled(res, sessionId)
      return true
    } catch (error) {
      // this.logger.error(`Error closing session ${sessionId}`, error)
      // Remove from tracking even if there was an error
      this.activeConnections.delete(sessionId)
      return false
    }
  }

  /**
   * Remove session from tracking without closing (for cleanup)
   */
  removeSession(sessionId: string): void {
    this.activeConnections.delete(sessionId)
  }

  /**
   * Check if connection is active
   */
  isSessionActive(sessionId: string): boolean {
    const res = this.activeConnections.get(sessionId)
    return res !== undefined && !this.isConnectionClosed(res)
  }

  /**
   * Close connection and remove from tracking
   */
  private closeConnection(res: Response, sessionId?: string): void {
    try {
      if (!this.isConnectionClosed(res)) {
        res.end()
      }
    } catch (error) {
      // Ignore errors if connection is already closed
      this.logger.error('Error closing SSE connection', error)
    } finally {
      // Remove from tracking if sessionId provided
      if (sessionId) {
        this.activeConnections.delete(sessionId)
      }
    }
  }

  /**
   * Check if response connection is closed
   */
  private isConnectionClosed(res: Response): boolean {
    return res.closed || res.destroyed || !res.writable
  }

  private sendEvent(res: Response, event: string, data: any): void {
    try {
      if (this.isConnectionClosed(res)) {
        return
      }

      res.write(`event: ${event}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      this.logger.error(`Error sending SSE event: ${event}`, error)
    }
  }
}
