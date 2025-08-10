import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Layout } from './components/Layout'
import { ConnectWallet } from './components/ConnectWallet'
import { ClientDashboard } from './pages/ClientDashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { ProductDetail } from './pages/ProductDetail'
import { TransferProduct } from './pages/TransferProduct'
import { CreateProduct } from './pages/CreateProduct'

function App() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Supply Chain Management
            </h1>
            <p className="text-primary-100">
              Blockchain-powered product traceability and authenticity
            </p>
          </div>
          <ConnectWallet />
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/client" replace />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/product/:tokenId" element={<ProductDetail />} />
          <Route path="/transfer/:tokenId" element={<TransferProduct />} />
          <Route path="/create" element={<CreateProduct />} />
          <Route path="*" element={<Navigate to="/client" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App 