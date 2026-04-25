import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('❌ ErrorBoundary capturó:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-exclamation-triangle text-3xl text-gray-400"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
            <p className="text-gray-500 text-sm">
              Ocurrió un error inesperado. Por favor recarga la página o vuelve al inicio.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 text-left text-xs bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>Recargar
            </button>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
              className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-home mr-2"></i>Inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
}
