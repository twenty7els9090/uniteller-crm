'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">Что-то пошло не так</p>
          </div>
          {this.state.error && (
            <p className="text-xs text-muted-foreground/70 max-w-md text-center">
              {this.state.error.message}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Попробовать снова
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
