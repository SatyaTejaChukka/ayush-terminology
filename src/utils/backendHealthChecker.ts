/**
 * Backend Health Check and Connection Test
 * Utility to verify backend connectivity and display status
 */

import { terminologyAPI } from '@/services/terminologyAPI'

export interface BackendStatus {
  isConnected: boolean
  isHealthy: boolean
  version: string
  latency: number
  error?: string
}

export class BackendHealthChecker {
  private static instance: BackendHealthChecker
  private lastCheck: BackendStatus | null = null
  private checkInterval: number | null = null

  static getInstance(): BackendHealthChecker {
    if (!BackendHealthChecker.instance) {
      BackendHealthChecker.instance = new BackendHealthChecker()
    }
    return BackendHealthChecker.instance
  }

  async checkHealth(): Promise<BackendStatus> {
    const startTime = Date.now()
    
    try {
      const response = await terminologyAPI.healthCheck()
      const latency = Date.now() - startTime
      
      this.lastCheck = {
        isConnected: true,
        isHealthy: response.status === 'healthy',
        version: response.version,
        latency,
      }
      
      return this.lastCheck
      
    } catch (error) {
      const latency = Date.now() - startTime
      
      this.lastCheck = {
        isConnected: false,
        isHealthy: false,
        version: 'unknown',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      
      return this.lastCheck
    }
  }

  getLastStatus(): BackendStatus | null {
    return this.lastCheck
  }

  startMonitoring(intervalMs: number = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Initial check
    this.checkHealth()

    // Periodic checks
    this.checkInterval = window.setInterval(() => {
      this.checkHealth()
    }, intervalMs)
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  async waitForBackend(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkHealth()
      
      if (status.isConnected && status.isHealthy) {
        return true
      }
      
      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return false
  }
}

// React hook for backend status monitoring
import { useState, useEffect } from 'react'

export function useBackendStatus(enableMonitoring: boolean = true) {
  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enableMonitoring) return

    const checker = BackendHealthChecker.getInstance()
    
    const checkStatus = async () => {
      setLoading(true)
      const newStatus = await checker.checkHealth()
      setStatus(newStatus)
      setLoading(false)
    }

    // Initial check
    checkStatus()

    // Start monitoring with updates every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [enableMonitoring])

  return { status, loading }
}