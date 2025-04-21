import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Mock API handlers
const handlers = [
  http.post('*/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 3,
        username: 'testuser',
        displayName: 'Test User',
        createdAt: '2025-04-14T20:22:22.000Z',
        isGuest: false
      }
    })
  }),
  http.post('*/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: 4,
        username: 'newuser',
        displayName: 'New User',
        createdAt: '2025-04-14T20:22:22.000Z',
        isGuest: false
      }
    })
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})