import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold text-gray-900">MeetManager</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600">Календарь встреч (фаза 5)</p>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
