import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-800 h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">حدث خطأ غير متوقع</h1>
          <p className="mb-4">عذراً، حدثت مشكلة أثناء عرض الصفحة.</p>
          <pre className="text-left bg-white p-4 rounded border whitespace-pre-wrap max-w-2xl text-sm overflow-auto">
            {this.state.error?.toString()}
          </pre>
          <button 
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold max-w-[200px]"
            onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/';
            }}>
                العودة للرئيسية
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
