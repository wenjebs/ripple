import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get Authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Proxy the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Forward Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    
    const response = await fetch(`${backendUrl}/goals/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
} 