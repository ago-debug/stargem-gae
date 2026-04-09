import { Component, ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props,State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h2 className="text-lg font-medium text-destructive mb-2">
            Errore nel caricamento della pagina
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message}
          </p>
          <button
            className="text-sm underline cursor-pointer"
            onClick={() => window.location.reload()}>
            Ricarica la pagina
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
