import { Component, ReactNode, ErrorInfo } from "react";
import { COLORS } from "../constants/colors";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#e2e8f0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "inherit"
        }}>
          <div style={{
            background: "#1e293b",
            borderRadius: 12,
            padding: 32,
            maxWidth: 400,
            textAlign: "center",
            border: `1px solid ${COLORS.danger}44`
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `${COLORS.danger}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 32
            }}>
              ⚠
            </div>

            <h1 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 500 }}>
              Algo salió mal
            </h1>

            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#94a3b8" }}>
              Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: COLORS.primary,
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Recargar
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: "#334155",
                  border: "none",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Reintentar
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details style={{ marginTop: 24, textAlign: "left" }}>
                <summary style={{ cursor: "pointer", color: "#94a3b8", fontSize: 12 }}>
                  Detalles del error (desarrollo)
                </summary>
                <pre style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#0f172a",
                  borderRadius: 8,
                  fontSize: 11,
                  overflow: "auto",
                  color: COLORS.danger
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
