import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

interface QRPaymentCodeProps {
  amount: string
  destination: string
  network?: string
  className?: string
}

export default function QRPaymentCode({ 
  amount, 
  destination, 
  network = "XRP Testnet",
  className = "" 
}: QRPaymentCodeProps) {
  const [imageError, setImageError] = useState(false)
  const [copied, setCopied] = useState(false)

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Address copied to clipboard!", {
        description: text,
        duration: 3000,
      })
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        toast.success("Address copied to clipboard!", {
          description: text,
          duration: 3000,
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
        toast.error("Failed to copy address", {
          description: "Please copy manually: " + text,
          duration: 5000,
        })
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* QR Code Container */}
      <div className="bg-white p-4 rounded-lg flex items-center justify-center">
        <div className="w-48 h-48 relative">
          {!imageError ? (
            <Image
              src="/images/qr-payment.jpg"
              alt={`XRP Payment QR Code - Scan to send ${amount} XRP`}
              width={192}
              height={192}
              className="rounded-lg object-contain"
              priority={true}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+RBw="
              style={{ width: '192px', height: '192px' }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 rounded-lg flex flex-col items-center justify-center text-neutral-600">
              <div className="w-16 h-16 border-4 border-dashed border-neutral-400 rounded-lg mb-2 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm">QR Code</span>
              <span className="text-xs text-center">Image not found</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-neutral-700 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Amount:</span>
          <span className="text-neutral-100 font-medium">{amount} XRP</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Destination:</span>
          <button
            onClick={() => copyToClipboard(destination)}
            className="group flex items-center space-x-1 text-neutral-100 font-mono text-xs hover:text-yellow-400 transition-colors cursor-pointer"
            title="Click to copy full address"
          >
            <span>{truncateAddress(destination)}</span>
            {copied ? (
              <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Network:</span>
          <span className="text-neutral-100">{network}</span>
        </div>
      </div>
    </div>
  )
} 